import { driver } from "https://cdn.jsdelivr.net/npm/driver.js@latest/dist/driver.js.mjs";

// CONFIGURACIÓ
const STORAGE_KEY = "travel-planner-trips";
const statusLabels = ["todo", "in-progress", "done"];

const statusNames = {
  todo: "Desitjat",
  "in-progress": "Planificat",
  done: "Realitzat"
};

const statusColors = {
  todo: "#eab308",
  "in-progress": "#3b82f6",
  done: "#22c55e"
};

const defaultTrips = [
  {
    id: "1",
    title: "París, França",
    description: "Visitar la Torre Eiffel",
    status: "done",
    lat: 48.8566,
    lng: 2.3522
  },
  {
    id: "2",
    title: "Tòquio, Japó",
    description: "Conèixer la cultura japonesa",
    status: "in-progress",
    lat: 35.6762,
    lng: 139.6503
  },
  {
    id: "3",
    title: "Nova York, Estats Units",
    description: "Visitar Manhattan",
    status: "todo",
    lat: 40.7128,
    lng: -74.0060
  }
];

// ELEMENTS DEL DOM
const form = document.querySelector("#new-task-form");
const titleInput = document.querySelector("#task-title-input");
const descriptionInput = document.querySelector("#task-desc-input");
const statusInput = document.querySelector("#task-status-select");
const template = document.querySelector("#task-card-template");
const badge = document.querySelector("#global-badge");
const startTourButton = document.querySelector("#start-tour");
const themeToggle = document.querySelector("#theme-toggle");

let trips = loadTrips();
let travelMap;
let travelChart;
const markers = new Map();
let selectedTripId = null;

// LOCALSTORAGE
function loadTrips() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (Array.isArray(saved)) {
      return saved;
    }
  } catch (error) {
    console.error("Error carregant viatges:", error);
  }

  return defaultTrips.map(trip => ({ ...trip }));
}

function saveTrips() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (error) {
    console.error("Error guardant viatges:", error);
  }
}

// WEB COMPONENT
class TaskBadge extends HTMLElement {
  static get observedAttributes() {
    return ["count"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "count" && oldValue !== newValue) {
      this.textContent = `${newValue} viatges`;
    }
  }
}

if (!customElements.get("task-badge")) {
  customElements.define("task-badge", TaskBadge);
}

function updateBadge() {
  badge?.setAttribute("count", String(trips.length));
}

// RENDERITZACIÓ DEL KANBAN
function renderTrips() {
  statusLabels.forEach(status => {
    const list = document.getElementById(`${status}-list`);
    if (!list) return;

    list.replaceChildren();

    trips
      .filter(trip => trip.status === status)
      .forEach(trip => list.append(createTripCard(trip)));
  });

  updateBadge();
  updateStatistics();
  renderMarkers();
}

function createTripCard(trip) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector(".task-card");

  card.querySelector(".task-title").textContent = trip.title;
  card.querySelector(".task-desc").textContent = trip.description || "";

  const statusClass = {
    todo: "desired",
    "in-progress": "planned",
    done: "completed"
  }[trip.status];

  if (statusClass) {
    card.classList.add(statusClass);
  }

  // CENTRAR EL MAPA EN EL DESTÍ
  card.querySelector(".task-title").addEventListener("click", () => {
    focusTrip(trip);
  });

  card.addEventListener("click", event => {
    if (event.target.closest("button, select")) return;

    document.querySelectorAll(".task-card.selected")
      .forEach(selectedCard => selectedCard.classList.remove("selected"));

    selectedTripId = trip.id;
    card.classList.add("selected");
  });


  // CANVIAR ESTAT
  const statusSelect = card.querySelector(".task-status-select");
  statusSelect.value = trip.status;

  statusSelect.addEventListener("change", () => {
    trip.status = statusSelect.value;
    saveTrips();
    renderTrips();
  });


  // PUJAR I BAIXAR VIATGES DINS DE LA MATEIXA COLUMNA
  card.querySelector(".btn-up").addEventListener("click", () => {
    moveTrip(trip, -1);
  });

  card.querySelector(".btn-down").addEventListener("click", () => {
    moveTrip(trip, 1);
  });

  // ELIMINAR
  card.querySelector(".btn-delete").addEventListener("click", () => {
    trips = trips.filter(item => item.id !== trip.id);
    saveTrips();
    renderTrips();
  });

  return fragment;
}


function moveTrip(trip, direction) {
  const columnTrips = trips.filter(item => item.status === trip.status);
  const currentIndex = columnTrips.findIndex(item => item.id === trip.id);
  const nextIndex = currentIndex + direction;

  if (nextIndex < 0 || nextIndex >= columnTrips.length) return;

  // Buscar el viatge amb el qual intercanviar la posició
  const otherTrip = columnTrips[nextIndex];

  // Trobar les posicions dins de l'array original
  const index1 = trips.findIndex(item => item.id === trip.id);
  const index2 = trips.findIndex(item => item.id === otherTrip.id);

  [trips[index1], trips[index2]] = [trips[index2], trips[index1]];

  saveTrips();
  renderTrips();
}


// MAPTILER
function initMap() {
  maptilersdk.config.apiKey = "vG8I6kNf6bpLRL7bfH0T";

  travelMap = new maptilersdk.Map({
    container: "map",
    style: maptilersdk.MapStyle.STREETS,
    center: [10, 25],
    zoom: 1.5
  });

  travelMap.on("load", () => {
    console.log("Mapa carregat correctament!");
    renderMarkers();
  });

  travelMap.on("error", error => {
    console.error("Error de MapTiler:", error);
  });
}

// BUSCAR COORDENADES D'UNA DESTINACIÓ
async function geocodeDestination(destination) {
  const apiKey = maptilersdk.config.apiKey;

  const url =
    `https://api.maptiler.com/geocoding/` +
    `${encodeURIComponent(destination)}.json` +
    `?key=${encodeURIComponent(apiKey)}&limit=1`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error de geocodificació: ${response.status}`);
  }

  const data = await response.json();
  const result = data.features?.[0];

  if (!result?.center) {
    throw new Error("No s'ha trobat la destinació");
  }

  return {
    lng: result.center[0],
    lat: result.center[1]
  };
}

// CREAR I ACTUALITZAR MARCADORS
function renderMarkers() {
  if (!travelMap || !travelMap.loaded()) return;

  // Eliminar els marcadors anteriors
  markers.forEach(marker => marker.remove());
  markers.clear();

  trips.forEach(trip => {
    if (!Number.isFinite(trip.lat) || !Number.isFinite(trip.lng)) {
      return;
    }

    const popupContent = document.createElement("div");
    const title = document.createElement("strong");
    const description = document.createElement("p");
    const status = document.createElement("p");

    title.textContent = trip.title;
    description.textContent = trip.description || "";
    status.textContent = statusNames[trip.status];

    popupContent.append(title, description, status);

    const popup = new maptilersdk.Popup({
      offset: 25
    }).setDOMContent(popupContent);

    const marker = new maptilersdk.Marker({
      color: statusColors[trip.status]
    })
      .setLngLat([trip.lng, trip.lat])
      .setPopup(popup)
      .addTo(travelMap);

    markers.set(trip.id, marker);
  });
}

// CENTRAR MAPA EN UN VIATGE
function focusTrip(trip) {
  if (!travelMap || !Number.isFinite(trip.lat) ||
    !Number.isFinite(trip.lng)) {
    return;
  }

  document.querySelector("#map-section")
    ?.scrollIntoView({ behavior: "smooth" });

  travelMap.flyTo({
    center: [trip.lng, trip.lat],
    zoom: 8,
    essential: true
  });

  markers.get(trip.id)?.togglePopup();
}

// CHART.JS I ESTADÍSTIQUES
function getTripCounts() {
  return statusLabels.map(status =>
    trips.filter(trip => trip.status === status).length
  );
}

function initChart() {
  const canvas = document.getElementById("travelChart");
  if (!canvas) return;

  const textColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--text-main").trim();

  travelChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Desitjats", "Planificats", "Realitzats"],
      datasets: [{
        data: getTripCounts(),
        backgroundColor: [
          statusColors.todo,
          statusColors["in-progress"],
          statusColors.done
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: textColor
          }
        },
        tooltip: {
          callbacks: {
            label(context) {
              const total = context.dataset.data
                .reduce((sum, value) => sum + value, 0);

              const percentage = total
                ? (context.parsed / total * 100).toFixed(1)
                : 0;

              return `${context.label}: ${percentage}%`;
            }
          }
        }
      }
    }
  });
}

function updateStatistics() {
  const counts = getTripCounts();

  if (travelChart) {
    travelChart.data.datasets[0].data = counts;
    travelChart.update();
  }
}

// FORMULARI
form?.addEventListener("submit", async event => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const status = statusInput.value;

  if (!title) return;

  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;

  try {
    // Buscar la ubicació amb MapTiler
    const coordinates = await geocodeDestination(title);

    const trip = {
      id: crypto.randomUUID?.() || String(Date.now()),
      title,
      description,
      status,
      lat: coordinates.lat,
      lng: coordinates.lng
    };

    trips.push(trip);

    saveTrips();
    renderTrips();
    form.reset();

  } catch (error) {
    console.error(error);
    alert("No s'ha pogut trobar la destinació. Prova d'escriure la ciutat i el país.");
  } finally {
    submitButton.disabled = false;
  }
});

// ACORDIÓ DE LES COLUMNES
document.querySelectorAll(".column-header").forEach(header => {
  header.addEventListener("click", () => {
    const column = header.closest(".column");
    const content = column?.querySelector(".column-content");

    content?.classList.toggle("collapsed");
    column?.classList.toggle("collapsed");
  });
});


// DRIVER.JS
function startTour() {
  const driverObj = driver({
    animate: true,
    showProgress: true,
    nextBtnText: "Següent",
    prevBtnText: "Anterior",
    doneBtnText: "Finalitzar"
  });

  driverObj.setSteps([
    {
      element: "#new-task-form",
      popover: {
        title: "Crear un viatge",
        description: "Introdueix una destinació, afegeix notes i selecciona l'estat."
      }
    },
    {
      element: "#board",
      popover: {
        title: "Organitzar viatges",
        description: "Gestiona els teus viatges desitjats, planificats i realitzats."
      }
    },
    {
      element: "#dashboard",
      popover: {
        title: "Estadístiques",
        description: "Consulta la distribució i els percentatges dels teus viatges."
      }
    },
    {
      element: "#map-section",
      popover: {
        title: "Mapa interactiu",
        description: "Explora les destinacions amb marcadors de diferents colors."
      }
    }
  ]);

  driverObj.drive();
}

startTourButton?.addEventListener("click", startTour);

// TEMA CLAR/FOSC
function updateThemeControls(theme) {
  const isDark = theme === "dark";
  const label = themeToggle?.querySelector(".theme-label");

  if (label) label.textContent = isDark ? "Mode clar" : "Mode fosc";
  themeToggle?.setAttribute(
    "aria-label",
    isDark ? "Activar el mode clar" : "Activar el mode fosc"
  );

  if (travelChart) {
    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--text-main").trim();
    travelChart.options.plugins.legend.labels.color = textColor;
    travelChart.update();
  }
}

const initialTheme = document.documentElement.dataset.theme || "light";
updateThemeControls(initialTheme);

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark"
    ? "light"
    : "dark";

  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("travel-planner-theme", nextTheme);
  updateThemeControls(nextTheme);
});

// INICIALITZACIÓ
initChart();
renderTrips();
initMap();

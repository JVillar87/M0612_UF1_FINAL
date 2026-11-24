## Gestor de Viatges — Kanban Pro (M0612 - Projecte Final)

Aquesta és la nova versió del Kanban que vam fer a l'AC6 i amb la base de la demo de classe, però adaptada per organitzar viatges directament al navegador i pujada a GitHub Pages.

**De què va l'aplicació?**

La idea és tenir un tauler visual per apuntar els llocs on vols anar i organitzar-los en tres columnes (Desitjat, Planificat i Realitzat). 
Inicialment, el projecte era un Kanban de tasques de l'AC6. Vaig decidir adaptar-lo a un gestor de viatges perquè la integració de MapTiler tingués més sentit (amb el vistiplau del professor). 
Aprofitant l'estructura que ja teníem (crear targetes, moure-les, reordenar-les, esborrar-les, plegar columnes, canviar entre mode clar/fosc i el comptador de viatges), hi he afegit que tot es guardi al navegador amb localStorage, un mapa interactiu, un gràfic d'estadístiques i una guia ràpida d'ajuda.

**Què pot fer?**

_Tauler Kanban de viatges (base AC6 ampliada):_

Permet crear targetes, reordenar-les dins de la mateixa columna amb les fletxes i canviar-les d'estat amb el desplegable. 
També es poden plegar i desplegar les columnes per guanyar espai i canviar entre el mode clar i fosc. Tot queda guardat al navegador amb localStorage perquè no es perdi en recarregar.
Funcionalitat 1 — Mapa interactiu i cerca de destinacions (MapTiler SDK - Integració amb ajuda d'IA):

Mostra tots els viatges en un mapa mundial amb xinxetes de colors segons l'estat de cada viatge. Quan escrius una ciutat o país al formulari, busca les coordenades automàticament i la col·loca al mapa.

_Estadístiques en temps real (Chart.js - Integració amb ajuda d'IA):_

Un gràfic circular (doughnut) que calcula al moment el percentatge de viatges que tens en cada estat.

_Funcionalitat 2 — Tutorial interactiu d'ajuda (Driver.js):_

Si prems el botó HELP, s'obre una guia pas a pas que t'ensenya com funciona cada part de la web sense haver d'anar endevinant-ho.

Com funciona el mapa: MapTiler SDK (Integració amb ajuda d'IA)

Per què he triat aquesta llibreria i com he fet servir la IA

He triat MapTiler SDK JS perquè té estils de mapa molt xulos i funciona directe des del navegador amb una clau pública (API Key), sense haver de muntar cap servidor ni backend. Això ho fa molt còmode per penjar-ho a GitHub Pages.

La part inicial del mapa, la cerca de coordenades i el gràfic de Chart.js els vaig treure amb l'ajuda d'eines d'intel·ligència artificial (IA). Després em vaig dedicar a repassar el codi, treure coses que sobraven o em complicaven la vida (com un modal d'edició amb <dialog> que hi havia al principi) i adaptar-ho tot perquè quadrés amb el meu Kanban de l'AC6.

**Què fa cada peça del codi del mapa**

_maptilersdk.config.apiKey:_ aquí és on li passo la clau de MapTiler perquè ens deixi carregar el mapa i buscar llocs.

_new maptilersdk.Map(options):_ dins de initMap(), s'encarrega de dibuixar el mapa dins del <div id="map">, triant l'estil (STREETS), on comença centrat i el zoom inicial.

_travelMap.on("load" / "error", callback):_ serveix per esperar que el mapa acabi de carregar abans de pintar les xinxetes (renderMarkers()) i per avisar per consola si alguna cosa falla.

_new maptilersdk.Marker({ color }):_ crea cada marcador al mapa amb el color que toca segons l'estat del viatge (#eab308 groc per a Desitjat, #3b82f6 blau per a Planificat i #22c55e verd per a Realitzat), el col·loca a les seves coordenades (.setLngLat()) i li enganxa la targeteta informativa (.setPopup()).

_new maptilersdk.Popup({ offset }):_ és el globus que s'obre quan cliques una xinxeta o el nom d'un viatge, on es veu el títol, les notes i l'estat.

_travelMap.flyTo({ center, zoom, essential }):_ dins de focusTrip(), fa l'efecte de volar suaument pel mapa fins a la ciutat quan cliques sobre el títol d'una targeta del tauler.

_Cerca de coordenades (geocodeDestination):_ fa una crida amb fetch() a l'API de geocodificació de MapTiler (https://api.maptiler.com/geocoding/{destinacio}.json) per convertir el text que escriu l'usuari en latitud i longitud (lat, lng).
Integració amb el Kanban: cada vegada que creo, elimino o canvio l'estat d'un viatge, renderTrips() actualitza les targetes, el comptador, les estadístiques i els marcadors del mapa. Així, el mapa i el gràfic sempre mostren les mateixes dades que el tauler.

**Com funciona la guia: Driver.js**

Per al tutorial he fet servir Driver.js amb driver() i driverObj.setSteps([...]) dins de startTour(), que s'activa en clicar el botó #start-tour de dalt de tot. El recorregut va assenyalant per ordre les quatre zones clau:

El formulari per afegir una destinació nova (#new-task-form).

El tauler Kanban per moure i organitzar els viatges (#board).

El panell d'estadístiques amb el gràfic (#dashboard).

La secció del mapa interactiu (#map-section).

**Què hi ha a cada fitxer**

_index.html:_ l'estructura de la pàgina, la plantilla <template> per crear targetes i els enllaços a les llibreries.

_styles.css:_ els estils, els colors del mode clar/fosc i l'adaptació a diferents mides de pantalla.

_app.js:_ tota la lògica del Kanban, el localStorage, el Web Component <task-badge>, el mapa amb MapTiler, el gràfic amb Chart.js i el tutorial de Driver.js.

_README.md:_ aquesta explicació del projecte.

**On es pot veure**

El projecte està publicat a GitHub Pages i també es pot executar en local amb Live Server de Visual Studio Code.

(ns jackal.core)

(defn tile [desc color attrs]
  (merge {:desc desc :color color} attrs)
)

(def teams [
  {:name "Призрачный" :pirate "Призрак"}
  {:name "Красный"    :pirate "Пират"  }
  {:name "Белый"      :pirate "Корсар" }
])

(defn grass []
  (tile "Трава" "#8DCF54" {})
)

(defn sea []
  (tile "Море" "#82F2E2" {:sea true})
)

(defn ship "Ship belonging to a team." [team]
  (tile (concat (get :name (nth team teams))) "#CD853F")
)

(defn chest "Chest contains some money." [money]
  (tile "Сундук" "#CD853F" {:money money})
)

(defn cannibal "Cannibal kills any pirate he meets." []
  (tile "Людоед" "#FF4411" {:team 0})
)

(defn maze "Labyrinths require additional turns to pass." [steps]
  (case steps
    2 (tile "Лес" "#5D9F34" {:steps 2})
    3 (tile "Пустыня" "#DDDD55" {:steps 3})
  )
)

(defn point [x y] {:x x :y y})

(def offsets {
  "e"  (point  1  0)
  "ne" (point  1 -1)
  "n"  (point  0 -1)
  "nw" (point -1 -1)
  "w"  (point -1  0)
  "sw" (point -1  1)
  "s"  (point  0  1)
  "se" (point  1  1)
})

(defn arrow "Arrows force a pirate to take an additional turn in any of provided directions." [desc offs]
  (let [coordOffs map #(get % offsets) off]
    (tile (concat "Стрелка " desc) "#DDDD55" {:offsets coordOffs})
  )
)

(def horseOffsets [
  (point  2 -1)
  (point  1 -2)
  (point -1 -2)
  (point -2 -1)
  (point -2  1)
  (point -1  2)
  (point  1  2)
  (point  2  1)
])

(defn horse "Horses are like arrows, and force a pirate to take a turn of a chess knight." []
  (tile "Конь" "#DDDD55" {:offsets horseOffsets})
)

(defn ice "Ice tile makes the pirate to repeat the last move." []
  (tile "Каток" "#77AAFF" {:offsets ["last"])
)

(defn chute "Parachute allows to \"teleport\" onto a ship, including carried money." []
  (tile "Парашют" "#FFAA77" {:chute true})
)

(defn pirate [teamId id pos]
  {:desc (get :pirate (nth teamId teams)) :team teamId :id id :pos pos}
)

(defn action [type desc pos] {:type type :desc desc :pos pos})

(defn moveAction [id pos] (action :move "Идти" pos)
;(defn )

(deftype board [tiles pirates players turn]
  Object
  (getTile [this pos] ()) ;TODO
  (possibleActions [this id]
    ([])
  ) ;TODO
  (piratesOn [this pos] (filter #(= pos (get :pos %)) pirates))
  (shipPosition [this team] (some #(when (= team (get :team %) %)) tiles))
  (driveShip [this team newPos] ()) ;TODO
  (movePirate [this id newPos] ()) ;TODO
  (kickPirate [this id] ()) ;TODO
  (killPirate [this id] ()) ;TODO
  (grabMoney [this id] ()) ;TODO
  (dropMoney [this id] ()) ;TODO
  (currentTurn [this] turn)
  (endTurn [this] ()) ;TODO
)

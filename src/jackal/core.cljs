(ns jackal.core)

(defn tile [type attrs]
  (merge {:type type} attrs)
)

(defn grass []
  (tile :grass {})
)

(defn sea []
  (tile :sea {})
)

(defn ship "Ship belonging to a team." [team]
  (tile :ship {:team team})
)

(defn chest "Chest contains some money." [money]
  (tile :chest {:money money})
)

(defn cannibal "Cannibal kills any pirate he meets." []
  (tile :cannibal {:team 0})
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
    (tile :arrow {:offsets coordOffs})
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
  (tile :horse {:offsets horseOffsets})
)

(defn ice "Ice tile makes the pirate to repeat the last move." []
  (tile :ice {})
)

(defn chute "Parachute allows to \"teleport\" onto a ship, including carried money." []
  (tile :chute {})
)

(defn pirate [teamId pos]
  {:desc (get :pirate (nth teamId teams)) :team teamId :pos pos}
)

(defn action [type desc pos] {:type type :desc desc :pos pos})

(defn moveAction [id pos] (action :move "Идти" pos)

; (deftype Board
;   [^:volatile-mutable tiles
;    ^:volatile-mutable pirates players turn
;   ]
;   Object
;   (get-tile [this pos] ()) ;TODO
;   (possible-actions [this id]
;     ([])
;   ) ;TODO
;   (pirates-on [this pos] (filter #(= pos (get :pos %)) pirates))
;   (ship-position [this team] (some #(when (= team (get :team %) %)) tiles))
;   (drive-ship! [this team newPos] ()) ;TODO
;   (move-pirate! [this id newPos] ()) ;TODO
;   (kick-pirate! [this id] ()) ;TODO
;   (kill-pirate! [this id] ()) ;TODO
;   (grab-money! [this id] ()) ;TODO
;   (drop-money! [this id] ()) ;TODO
;   (current-turn [this] turn)
;   (end-turn! [this] ()) ;TODO
; )

(defn board [tiles pirates players]
  {:tiles tiles :pirates pirates :players players :turn 0}
)

(defn get-tile [board pos]
  (get pos (get :tiles board))
)

(defn pirates-on [board pos]
  (filter #(= pos (get :pos %)) (get :pirates board))
)

(defn grab-money [board id]

)

(defn drop-money [board id]
  (let
    [
    ]
    body
  )
)

(defn move-pirate [board id pos]
  (update-in board [:pirates id :pos] #(pos))
)

(defn kill-pirate [board id]
  (update board :pirates #(dissoc % id))
)

(defn current-turn [board] (get :turn board))

(defn end-turn [board]
  (let [{players :players} board]
    (update board :turn #(mod (inc %) (count players)))
  )
)

(def test-tiles
  [ (grass) (arrow "<->" ["e" "w"]) (grass) (chest 1) (cannibal)
    (arrow "_\|" ["se"]) (chest 2) (grass) (grass) (chute)
    (maze 2) (grass) (maze 3) (grass) (grass)
    (grass) (ice) (chest 1) (grass) (grass)
    (grass) (arrow "|" ["s" "n"]) (grass) (grass) (grass)
  ]

(def test-board [half-size]
  (let
    [ size (inc (* 2 half-size))
      border? #(or (zero? %) (= size %))
      tilemap (for [i (range size) j (range size) :let [k (+ (* size (dec j)) (dec i))]]
        [ (point i j)
          (if (or (border? i) (border? j))
            (sea)
            (nth k test-tiles)
          )
        ]
      )
      start-pos-1 (point half-size 0)
      start-pos-2 (point half-size size)
      tiles (union (into {} tilemap) {start-pos-1 (ship 1) start-pos-2 (ship 2)})
      pirates [(pirate 1 1 start-pos-1) (pirate 2 2 start-pos-2)]
      players [1 2]
    ]
    (board tiles pirates players)
  )
)

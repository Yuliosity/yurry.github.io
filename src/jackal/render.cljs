(ns jackal.render)

(def teams [
  {:name "Призрачный" :pirate "Призрак"}
  {:name "Красный"    :pirate "Пират"  }
  {:name "Белый"      :pirate "Корсар" }
])

;(concat (get :name (nth team teams)))

(def text-tiles
  { :grass    ["Трава"   "#8DCF54"]
    :sea      ["Море"    "#82F2E2"]
    :chest    ["Сундук"  "#CD853F"]
    :ship     ["Корабль" "#CD853F"]
    :cannibal ["Людоед"  "#FF4411"]
    :horse    ["Конь"    "#DDDD55"]
    :ice      ["Каток"   "#77AAFF"]
    :chute    ["Парашют" "#FFAA77"]
    :arrow    ["Стрелка" "#DDDD55"]
  }
)

(defn render-tile [tile]
  (let
    [ {desc :desc color :color money :money} tile
      money-label (if money (concat "<br/>Бабло: " money) "")
    ]
    (concat "<div bgcolor=" color ">" desc money-label "</div>")
  )
)

(defn render-pirate [pirate]
  (let
    [ {desc :desc money :money step :step} pirate
      money (if money " с баблом" "")
      step (if step (concat " _" step) "")
    ]
    (concat base money step)
  )
)

function Cell(desc, color, attrs) {
    if(attrs === undefined)
        attrs = {movable: true}
    if(attrs.movable === undefined)
        attrs.movable = true

    this.desc = desc;
    this.color = color;
    for(attr in attrs)
        this[attr] = attrs[attr]
}

var Cells = {
    grass: function() { return new Cell("Трава", "#8DCF54") },
    sea: function() { return new Cell("Море", "#82F2E2", {water: true, movable: false}) },
    ship: function() { return new Cell("Корабль", "#CD853F", {ship: true}) },
    chest: function(money) { return new Cell("Сундук", "#CD853F", {money: money}) }
}

function Field(size) {
    this.size = size;

    var field = []

    function cell(x, y) { 
        var result = field[y * size + x]
        result.x = x
        result.y = y

        return result
    }
    this.cell = cell

    function setCell(x, y, what) { field[y * size + x] = what }
    this.setCell = setCell

    var pirates = []
    this.addPirate = function (id, x, y) { pirates.push({desc: "Пират", id: id, x: x, y: y}) }

    function piratesOn(x, y) {
        return pirates.filter(function(pirate) { return pirate.x == x && pirate.y == y })
    }
    this.piratesOn = piratesOn

    function neightbours(p) {
        var result = []
        for(var x=p.x-1;x<= p.x+1;x++)
            for(var y=p.y-1;y<=p.y+1;y++) {
                if(x == p.x && y == p.y)
                    continue;

                if(x < 0 || x >= size)
                    continue;
                if(y < 0 || y >= size)
                    continue;

                result.push(cell(x, y));
            }

        return result;
    }

    function moveActions(p) {
        return neightbours(p)
            .filter(function(cell) { return cell.movable })
            .map(function(cell) { 
                return { name: "move",
                         desc: "Идти",
                         x: cell.x, y: cell.y,
                         action: function() { 
                             p.x = cell.x
                             p.y = cell.y
                         }}})
    }

    function moneyActions(p) {
        if (p.money)
            return [{ name: "drop",
                      desc: "Положить",
                      x: p.x, y: p.y,
                      action: function() { 
                          var c = cell(p.x, p.y);
                          if(c.money === undefined)
                              c.money = 1
                          else
                              c.money++
                          p.money = null
                      }}]
        else if(cell(p.x, p.y).money && !p.money)
            return [{ name: "grab",
                      desc: "Взять",
                      x: p.x, y: p.y,
                      action: function() { 
                          cell(p.x, p.y).money--
                          p.money = 1
                      }}]

        return []
    }

    function sailActions(p) {
        if (!cell(p.x, p.y).ship)
            return []
            
        return [p.x - 1, p.x + 1].map(
            function(x) {
                return { name: "sail",
                         x: x, y: p.y,
                         desc: "плыть",
                         action: function() { 
                             var ship = cell(p.x, p.y)
                             setCell(p.x, p.y, Cells.sea())
                             setCell(x, p.y, ship)
                             for(var pirate of piratesOn(p.x, p.y))
                                 pirate.x = x
                         }}})
    }
        
    this.actions = function(p) { return moveActions(p).concat(moneyActions(p), sailActions(p)); }

    for (var j = 0; j < size; ++j) {
        for (var i = 0; i < size; ++i) {
            if (j == 0 || j == fieldSize - 1 ||
                i == 0 || i == fieldSize - 1)
                this.setCell(i, j, Cells.sea())
            else
                this.setCell(i, j, Cells.grass())
        }
    }
    var n = 1;
    for (var i = 1; i <= 3; ++i) {
        for (var j = 1; j <= 3 - i; ++j) {
            this.setCell(n++, 1, Cells.chest(j))
        }
    }
    this.setCell((size - 1) / 2, 0, Cells.ship())
}

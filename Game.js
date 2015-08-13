
/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function repeat(n, value ) {
  return Array.apply(null, Array(n)).map(function(_) {return value;});
}

var teams = ["Призрачный", "Красный", "Белый"];

//Game
function grassCell() {
  return {desc: "Трава", color: "#8DCF54"}
}

function seaCell() {
  return {desc: "Море", color: "#82F2E2", noMove: true}
}

function shipCell() {
  return {desc: "Корабль", shipTeam: 1, color: "#CD853F"}
}

function chestCell(money) {
  return {desc: "Сундук", money: money, color: "#CD853F"};
}

function makePirate(id, i, j) {
  return {
    desc: "Пират", team: 1, id: id, x: i, y: j,
    /*move: function(ti, tj) {
      this.x = ti; this.y = tj;
    }*/
  };
}

function posIndex(i, j) { return j * fieldSize + i; }

var offsets = [{x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: -1}, {x: -1, y: -1},
               {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: 1}, {x: 1, y: 1}];

function emptyBoard(size) {
  return {
    size: size,
    field: [],
    cell: function(i, j, what) {
      if (what === undefined)
        return this.field[size * j + i];
      else
        this.field[size * j + i] = what;
    },

    pirates: [],
    pirate: function(i, what) {
      if (what === undefined)
        return this.pirates[i];
      else
        this.pirates[i] = what;
    },

    piratesOn: function(i, j) {
      var res = [];
      for (var p of this.pirates) {
        if (p && p.x == i && p.y == j)
          res.push(p);
      }
      return res;
    },

    possibleActions: function(p) {
      var res = [];
      for (off of offsets) {
        var i = p.x + off.x, j = p.y + off.y;
        if (i >= 0 && i < this.size &&
            j >= 0 && j < this.size &&
            !this.cell(i, j).noMove)
          res.push({
            action: "move", x: i, y: j,
            desc: "Идти", act: function(who, where) {
              where.move(who, this.x, this.y);
            }
          });
      }
      //Drop the money if the pirate has it
      if (p.money)
        res.push({
          action: "drop", x: p.x, y: p.y,
          desc: "Положить", act: function(who, where) {
            where.drop(who);
          }
        });
      //Grab the money it he doesn't
      else if (this.cell(p.x, p.y).money)
        res.push({
          action: "grab", x: p.x, y: p.y,
          desc: "Взять", act: function(who, where) {
            where.grab(who);
          }
        });
      //Drive the ship
      if (this.cell(p.x, p.y).shipTeam) {
        var driveOffsets = [{x: 1, y: 0}, {x: -1, y: 0}];
        for (var off of driveOffsets) {
          var i = p.x + off.x, j = p.y + off.y;
          res.push({
            action: "drive", x: i, y: j,
            desc: "Плыть", act: function(who, where) {
              var ship = where.cell(who.x, who.y);
              where.cell(who.x, who.y, seaCell());
              where.cell(this.x, this.y, ship);
              for (var p of where.piratesOn(who.x, who.y))
                where.move(p, this.x, this.y);
            }
          });
        }
      }
      return res;
    },

    move: function(p, i, j) {
      //TODO: check possibility
      p.x = i; p.y = j;
    },

    grab: function(p) {
      var c = this.cell(p.x, p.y);
      if (c.money && !p.money) {
        c.money--;
        p.money = 1;
      }
    },

    drop: function(p) {
      var c = this.cell(p.x, p.y);
      if (p.money) {
        if (c.money === undefined)
          c.money = 0;
        c.money++;
        p.money = 0;
      }
    },
  }
}

function defaultBoard(size) {
  var board = emptyBoard(size);
  for (var j = 0; j < size; ++j) {
    for (var i = 0; i < size; ++i) {
      if (j == 0 || j == fieldSize - 1 ||
          i == 0 || i == fieldSize - 1)
          board.cell(i, j, seaCell());
      else
          board.cell(i, j, grassCell());
    }
  }
  var n = 1;
  for (var i = 1; i <= 3; ++i) {
    for (var j = 1; j <= 3 - i; ++j) {
      board.cell(n++, 1, chestCell(j));
    }
  }
  board.cell((size - 1) / 2, 0, shipCell());
  return board;
}

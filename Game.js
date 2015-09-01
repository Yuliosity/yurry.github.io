//---- Common methods ----
/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 */
//"use strict"; //Commented due to a Safari bug

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

var offsets = {
  e:  {x: 1,  y: 0},
  ne: {x: 1,  y: -1},
  n:  {x: 0,  y: -1},
  nw: {x: -1, y: -1},
  w:  {x: -1, y: 0},
  sw: {x: -1, y: 1},
  s:  {x: 0,  y: 1},
  se: {x: 1,  y: 1}
};

//---- Board tiles ----
function Tile(desc, color, attrs) {
  this.desc = desc;
  this.color = color;
  for (var attr in attrs)
    if (attr != "type")
      this[attr] = attrs[attr];
}

var Tiles = {

  //Dumb plain grass.
  grass: function() {
    return new Tile("Трава", "#8DCF54");
  },

  //Sea. Can be traversed only by ship or cannon-launched pirate.
  sea: function() {
    return new Tile("Море", "#82F2E2", {sea: true});
  },

  //Ship belonging to a team.
  ship: function(params) {
    return new Tile(teams[params.team].name + " корабль", "#CD853F", params);
  },

  //Chest contains some money.
  chest: function(params) {
    return new Tile("Сундук", "#CD853F", params);
  },

  //Cannibal kills any pirate he meets.
  cannibal: function() {
    return new Tile("Людоед", "#FF4411", {team: 0});
  },

  //Labyrinths require additional turns to pass.
  _labyrinths: [
    new Tile("Лес", "#5D9F34", {steps: 1}),
    new Tile("Пустыня", "#DDDD55", {steps: 2}),
    //{desc: "Болото", },
    //{desc: "Горы", },
  ],

  //TODO: clone?
  labyrinth: function(params) {
    return this._labyrinths[params.steps - 1];
  },

  //Arrows force a pirate to take an additional turn in any of provided directions.
  arrow: function(params) {
    var coordOffs = params.offs.map(function(off) {return offsets.off;});
    return new Tile("Стрелка " + params.desc, "#DDDD55", {offsets: coordOffs});
  },

  _horseOffsets: /*{*/ [
    /*nww:*/ {x: 2,  y: -1},
    /*nnw:*/ {x: 1,  y: -2},
    /*nne:*/ {x: -1, y: -2},
    /*nee:*/ {x: -2, y: -1},
    /*see:*/ {x: -2, y: 1},
    /*sse:*/ {x: -1, y: 2},
    /*ssw:*/ {x: 1,  y: 2},
    /*sww:*/ {x: 2,  y: 1}
  /*}*/ ],

  //Horses are like arrows, and force a pirate to take a turn of a chess knight.
  horse: function() {
    return new Tile("Конь", "#DDDD55", {offsets: this._horseOffsets});
  },

  //Ice tile makes the pirate to repeat the last move.
  ice: function() {
    return new Tile("Каток", "#77AAFF", {offsets: ["last"]});
  },

  //Parachute allows to "teleport" onto a ship, including carried money.
  chute: function() {
    return new Tile("Парашют", "#FFAA77", {chute: true});
  },
}

//---- Pirates and their teams ----
var teams = [
  {name: "Призрачный", pirate: "Призрак"},
  {name: "Красный", pirate: "Пират"},
  {name: "Белый", pirate: "Корсар"},
];

function makePirate(teamId, id, i, j) {
  return {
    desc: teams[teamId].pirate, team: teamId, id: id, x: i, y: j,
  };
}

//---- Game board "class" ----
function Board(size) {
  this.size = size;
  this._field = [];

  //TODO: configurable teams
  this.players = [1, 2];
  this.pirates = [];

    //
  this.turnIndex = 0;

    //Gets or sets a tile.
  this.tile = function(i, j, what) {
      if (what === undefined)
        return this._field[this.size * j + i];
      else
        this._field[this.size * j + i] = what;
  };

  //Gets or sets a pirate.
  //TODO: should it be there?
  this.pirate = function(i, what) {
    if (what === undefined)
      return this.pirates[i];
    else
      this.pirates[i] = what;
  };

  //Some observing functions

  this._indexPos = function(i) {
    return {x: i % this.size, y: Math.floor(i / this.size)};
  };

  //Returns array of pirates on some tile
  this.piratesOn = function(i, j) {
    var res = [];
    for (var p of this.pirates) {
      if (p && p.x == i && p.y == j)
        res.push(p);
    }
    return res;
  };

  //Return the position of the ship of some team
  this.shipPosition = function(teamId) {
    //TODO: optimize
    for (var i in this._field)
      if (this._field[i].team === teamId)
        return this._indexPos(i);
  };

  //Returns an array of what a pirate can do this turn.
  //TODO: remove "who" and "where" as long they can be stored in the closure
  //POSSIBLE TODO: make polymorphic method in tiles?
  this.possibleActions = function(p) {
    var res = [];
    //Wait for his team's turn
    if (p.team !== this.players[this.turnIndex])
      return res;
    //In the labyrinth
    if (p.step) {
      res.push({
        action: "move", x: p.x, y: p.y,
        desc: "Ползти", act: function(who, where) {
          return where.move(who, this.x, this.y);
        }
      });
    }
    //Can go wherever is possible
    else for (var off in offsets) {
      var i = p.x + offsets[off].x,
          j = p.y + offsets[off].y;
      if (i >= 0 && i < this.size &&
          j >= 0 && j < this.size &&
          //Can swim only if already in the sea
          this.tile(i, j).sea == this.tile(p.x, p.y).sea)
        res.push({
          action: "move", x: i, y: j,
          desc: "Идти", act: function(who, where) {
            return where.move(who, this.x, this.y);
          }
        });
    }

    var tile = this.tile(p.x, p.y);
    //Drop the money if the pirate has it
    if (p.money)
      res.push({
        action: "drop", x: p.x, y: p.y,
        desc: "Положить", act: function(who, where) {
          return where.drop(who);
        }
      });
    //Grab the money if he doesn't
    else if (tile.money)
      res.push({
        action: "grab", x: p.x, y: p.y,
        desc: "Взять", act: function(who, where) {
          return where.grab(who);
        }
      });
    //Drive the ship
    if (tile.team === p.team) {
      //TODO: vertical teams
      var driveOffsets = [{x: 1, y: 0}, {x: -1, y: 0}];
      for (var off of driveOffsets) {
        var i = p.x + off.x, j = p.y + off.y;
        if (i < 1 || i > this.size - 2)
          continue;
        res.push({
          action: "drive", x: i, y: j,
          desc: "Плыть", act: function(who, where) {
            return where.drive(who, this.x, this.y);
          }
        });
      }
    }
    //Flee with a parachute
    if (tile.chute) {
      var pos = this.shipPosition(p.team);
      res = [{
        action: "move", x: pos.x, y: pos.y,
        desc: "Лететь", act: function(who, where) {
          return where.move(who, this.x, this.y);
        }
      }];
    }
    return res;
  };

  //Methods which axtually perform player actions
  //Drive a ship with a pirate
  this.drive = function(p, i, j) {
    var ship = this.tile(p.x, p.y);
    this.tile(p.x, p.y, Tiles.sea());
    this.tile(i, j, ship);
    for (var tp of this.piratesOn(p.x, p.y))
      this._move(tp, i, j);
    this._completeTurn();
    return true;
  };

  //Move a pirate
  this._move = function(p, i, j) {
    if (p.x === i && p.y === j && p.step) {
      //Make a step in the labyrinth
      if (p.step < this.tile(p.x, p.y).steps)
        ++p.step;
      else
      //Get out of the labyrinth
        p.step = undefined;
    }
    else {
      p.x = i; p.y = j;
      p.step = this.tile(i, j).steps ? 1 : undefined;
      //Sink the gold
      if (this.tile(i, j).sea)
        p.money = 0;
    }
  };

  this.move = function(p, i, j) {
    var prev_x = p.x, prev_y = p.y;
    //TODO: check possibility
    this._move(p, i, j);
    //Kick all enemy pirates
    var board = this;
    this.piratesOn(i, j).forEach(function (tp) {
      if (tp.team !== p.team && tp.step === p.step)
        board.kick(tp);
    });

    if (this.tile(i, j).offsets !== undefined) {
      return this.tile(i, j).offsets.map(function (off) {
        var ti, tj;
        if (off === "last") {
          //Repeat the last step
          //TODO: what if from an airplane?
          ti = p.x + p.x - prev_x;
          tj = p.y + p.y - prev_y;
        }
        else {
          ti = i + off.x; tj = j + off.y;
        }
        return {action: "move", x: ti, y: tj,
          desc: "Прыг", act: function(who, where) {
            return where.move(who, this.x, this.y);
          }
        };
      });
    }
    else {
      var teamId = this.tile(p.x, p.y).team;
      if (teamId !== undefined && teamId !== p.team)
        this.die(p);
      this._completeTurn();
      return true;
    }
  };

  //Grab a coin by a pirate
  this.grab = function(p) {
    var c = this.tile(p.x, p.y);
    if (c.money && !p.money) {
      c.money--;
      p.money = 1;
      return true;
    }
    return false;
  };

  //Drop the coin by a pirate
  this.drop = function(p) {
    var c = this.tile(p.x, p.y);
    if (p.money) {
      if (c.money === undefined)
        c.money = 0;
      c.money++;
      p.money = 0;
      return true;
    }
    return false;
  };

  //Get pirate kicked to the team ship
  this.kick = function(p) {
    var pos = this.shipPosition(p.team);
    this.drop(p);
    this._move(p, pos.x, pos.y);
  };

  //Death from anything
  this.die = function(p) {
    this.drop(p);
    this.pirates[p.id] = undefined;
    //TODO: team loses if doesn't have pirates left
  };

  //(private) Ends the current player turn
  this._completeTurn = function() {
    this.turnIndex = (this.turnIndex + 1) % this.players.length;
  };

  this.currentTeam = function() {
    return teams[this.players[this.turnIndex]];
  };
}

var test = [
  [{"type": "sea"}, {"type": "sea"}, {"type": "ship", "team": 1}, {"type": "sea"}, {"type": "sea"}],
  [{"type": "sea"}, {"type": "chest", "money": 3}, {"type": "grass"}, {"type": "grass"}, {"type": "sea"}],
  [{"type": "sea"}, {"type": "chest", "money": 1}, {"type": "labyrinth", "steps": 2}, {"type": "chute"}, {"type": "sea"}],
  [{"type": "sea"}, {"type": "arrow", "desc": "↕︎", "offs": ["n", "s"]}, {"type": "grass"}, {"type": "cannibal"}, {"type": "sea"}],
  [{"type": "sea"}, {"type": "sea"}, {"type": "ship", "team": 2}, {"type": "sea"}, {"type": "sea"}],
]

//Makes a board from the server JSON data
function serverBoard(arr) {
  var res = new Board(arr.length); //Assuming the data correctness
  for (var j = 0; j < arr.length; ++j) {
    for (var i = 0; i < arr.length; ++i) {
      res.tile(i, j, Tiles[arr[i][j]["type"]](arr[i][j]));
    }
  }
  return res;
}

function testBoard(s) {
  var size = 2 * s + 1;
  var board = new Board(size);
  for (var j = 0; j < size; ++j) {
    for (var i = 0; i < size; ++i) {
      if (j == 0 || j == size - 1 ||
          i == 0 || i == size - 1)
          board.tile(i, j, Tiles.sea());
      else
          board.tile(i, j, Tiles.grass());
    }
  }
  //Some chests
  var n = 1;
  for (var i = 1; i <= 3; ++i) {
    for (var j = 1; j <= 3 - i; ++j) {
      board.tile(n++, 1, Tiles.chest({money: j}));
    }
  }
  //Some arrows
  board.tile(s, 2, Tiles.arrow({desc:"↔︎", offs: ["w", "e"]}));
  board.tile(s + 1, 2, Tiles.arrow({desc: "↕︎", offs: ["n", "s"]}));

  board.tile(2, 2, Tiles.ice());
  board.tile(3, 3, Tiles.cannibal());
  board.tile(4, 4, Tiles.chute());
  //Some labyrinths
  board.tile(1, 2, Tiles.labyrinth({steps: 2}));
  board.tile(2, 5, Tiles.labyrinth({steps: 1}));

  //TODO: shuffling

  //Ships for two teams
  board.tile(s, 0, Tiles.ship({team: 1}));
  board.tile(s, size - 1, Tiles.ship({team: 2}));
  //One pirate for each team
  var pCount = 0;
  for (var teamId of board.players) {
    var pos = board.shipPosition(teamId);
    for (var i = 0; i < 3; ++i) {
      var somePirate = makePirate(teamId, ++pCount, pos.x, pos.y);
      board.pirate(somePirate.id, somePirate);
    }
  }


  return board;
}

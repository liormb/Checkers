
var board = new Checkers();
var squareWidth = squareHeight = 80;
var pieceLeftPosition, pieceTopPosition;
var piecePadding = '7 7';

var audio = {
	pieceMove: new Audio('../assets/mp3/piece-move.mp3'),
	piecePicked: new Audio('../assets/mp3/piece-picked.mp3')
};

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

var squareNumber = function(square){
	var value = square[0].toUpperCase().charCodeAt() - 64;
	return value + (square[1] - 1) * 8;
};

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

function sortFunc(a, b){
	return (a - b);
}

// Piece Constractor
// creating new piece and adding a draggable & droppable functinality
// giving an option to destroy a single piece
function Piece(kind, position){
	this.kind = kind;
	this.position = position;
}
Piece.prototype.create = function(){
	var self = this;
	$('#square-'+this.position).append('<div id="piece" class="'+this.kind+'-piece"></div>');
	$('#square-'+this.position+' .'+this.kind+'-piece').draggable({
		cursor: 'move',
		revert: true,
		containment: 'body',
		start: function(event, ui){
			var lastSquare;
			var current = self.position;
			var factor = (self.kind === "light") ? 1 : -1;
			var validMoves = self.legalMoves();
			var largestSquare = Math.max.apply(Math, validMoves);
			var lastRow = (largestSquare % 8 === 0) ? largestSquare - 7 : 8 * (Math.floor(largestSquare/8)) + 1;

			$('#square-'+self.position).addClass('trail');

			for (var i=1; i < validMoves.length; i++){
				$target = $('#square-'+validMoves[i]);
				
				$target.droppable({
					accept: $(this),
					hoverClass: "hover-trail",
					tolerance: 'intersect',
					drop: function(event, ui){
						self.move();
						//$(this).droppable('disable');
						ui.draggable.position({of: $(this), at: piecePadding});
					},
					over: function(event, ui){
						var temp = parseInt(event.target.id.replace(/[^\d.]/g,''));
						var bool = $('#square-'+temp).hasClass('trail');
						lastSquare = (bool) ? "undefined" : current;
						current = temp;
						var diff = Math.abs(current - lastSquare);

						if (!bool) $('#square-'+current).addClass('trail');

						if (((diff < 7 || (diff > 9 && diff < 14) || diff > 18) && !bool) || bool || (current - lastSquare)*factor < 0 ||
							 ((diff === 14 || diff === 18) && (!board.squares[diff/2]))){
							var trail = self.trail(current);
							$('#checker-board div').not('#square-'+self.position).removeClass('trail');
							for (var i=0; i < trail.length; i++){
								$('#square-'+trail[i]).addClass('trail');
							}
						}
					},
					out: function(event, ui){
						var last = true;
						current = parseInt(event.target.id.replace(/[^\d.]/g,''));
						var jumps = [ current+7*factor, current+9*factor, current+14*factor, current+18*factor ];

						for (var i=0; i < validMoves.length; i++){
							if (jumps.indexOf(validMoves[i]) !== -1){
								last = false;
								break;
							}
						}
						if (last){
							$('#checker-board div').not('#square-'+self.position).removeClass('trail');
							lastSquare = "undefined";
							current = self.position;
						}
					}
				});
			}
    },
    stop: function(event, ui){
			$('#checker-board div').droppable()
				.droppable("destroy")
				.removeClass('trail');
    }
	});
};
Piece.prototype.move = function(){
	var trails = [];
	var factor = (this.kind === "light") ? 1 : -1;
	var $trails = $('#checker-board').find('.trail');

	$('#checker-board div').removeClass('trail');
	
	for (var i=0; i < $trails.length; i++){
		trails.push( parseInt($trails[i].id.replace(/[^\d.]/g,'')) );
	}
	(factor === 1) ? trails.sort(sortFunc) : trails.sort(sortFunc).reverse();

	if (trails.length > 1){
		for (var i=1; i < trails.length; i++){
			var oldPos = trails[i-1];
			var newPos = trails[i];
			var target = oldPos + Math.abs(newPos - oldPos)/2*factor;
			var $piece = $('#square-'+oldPos+' #piece');

			$('#square-'+newPos).append($piece);
			if (target % 1 === 0) audio.piecePicked.play();
			$('#square-'+target+' #piece').effect("explode", 250, function(e){
				$(this).remove();
			});

			board.squares[newPos] = board.squares[oldPos];
			board.squares[oldPos] = "";
			if (target % 1 === 0) board.squares[target] = "";
			audio.pieceMove.play();
		}
		board.squares[newPos].position = newPos;
	}
};
Piece.prototype.legalMoves = function(position, moves){
	var factor = (this.kind === "light") ? 1: -1;
	var validMoves = (moves) ? moves.slice(0) : [this.position];
	var pos = (position) ? position : this.position;
	var newPosition, oneJump, twoJump;

	if (!(position) && !(moves)){
		for (var i=7; i <= 9; i+=2){
			oneJump = this.position + i*factor;
			twoJump = this.position + i*factor*2;
			(!(board.squares[oneJump]) && $('#square-'+oneJump).hasClass('black-square')) ? 
				validMoves.push(oneJump) : validMoves = validMoves.concat(this.legalMoves(this.position, validMoves));
		}
		return validMoves.filter(onlyUnique);
	}

	for (var i=7; i <= 9; i+=2){
		newPosition = pos;
		oneJump = pos + i*factor
		twoJump = pos + i*factor*2;
		if (board.squares[oneJump] && board.squares[oneJump].kind !== this.kind && 
			!(board.squares[twoJump]) && twoJump < 64 && $('#square-'+twoJump).hasClass('black-square')){
			validMoves.push(twoJump);
		}
	}
	var diff = validMoves.diff(moves);
	if (diff){
		for (var i=0; i < diff.length; i++){
			validMoves = validMoves.concat(this.legalMoves(diff[i], validMoves));
		}
	}
	return validMoves.filter(onlyUnique);
};
Piece.prototype.trail = function(end, arr){
	var legalMoves = this.legalMoves();
	var factor = (this.kind === "light") ? 1: -1;
	var moves = arr || [end];

	for (var j=14; j <= 18; j += 4){
		oneJump = end - j*factor/2;
		twoJump = end - j*factor;			

		if (legalMoves.indexOf(twoJump) !== -1 && 
			  moves[moves.length - 1] !== this.position &&
			  board.squares[oneJump].kind !== this.kind &&
			  board.squares[oneJump] && !(board.squares[twoJump])){
			moves.push(twoJump);
			this.trail(twoJump, moves);
		} else if (twoJump === this.position){ moves.push(twoJump); }
	}
	return moves.filter(onlyUnique);
};
Piece.prototype.destroy = function() {
	$('#square-'+this.position+' #piece').remove();
};

// the CheckersBoard Constractor
function Checkers() {
	this.squares = [];
}

Checkers.prototype.movePiece = function(fromSquare, toSquare) {
	var fromPosition = squareNumber(fromSquare);
	var toPosition = squareNumber(toSquare);
	var difference = toPosition - fromPosition;
	var distance = Math.abs(difference);
	var jump = (distance >= 10) ? true : false;
	var kind = board.squares[fromPosition].kind
	var legal = false;

	// check if the move is legal
	if ((difference > 0 && kind == "light") || (difference < 0 && kind == "dark")) {
		if (jump) {
			if (distance == 14 || distance == 18){
				var middlePiecePosition = Math.min(fromPosition, toPosition) + distance/2;
				if (board.squares[middlePiecePosition] && board.squares[middlePiecePosition].kind != kind){
					legal = true;
				}
			}
		} else if (distance == 7 || distance == 9) {
			legal = true;
		}
	}

	if (legal) {
		board.squares[toPosition] = new Piece(kind, toPosition); 
		board.squares[toPosition].create();

		board.squares[fromPosition].destroy();
		board.squares[fromPosition] = "";

		if (jump && board.squares[middlePiecePosition]) { 
			board.squares[middlePiecePosition].destroy();
			board.squares[middlePiecePosition] = "";
		}
	} else {
		console.log("Ilegal Move!");
	}
	return legal;
};

// setting up a new game board by:
// 1. adding 64 square div's to the board
// 2. initializing board.squares array with piece div or empty string
// 3. adding black-square class to every black square board
Checkers.prototype.newGame = function() {
	var squareTopOffset = 42;
	board.squares.push(64);

	for (var row = 1; row <= 8; row++) {
		var squareLeftOffset = 42;
		for (var col = 1; col <= 8; col++) {
			var position = col + (row * 8) - 8;
			var piece;
			
			$('#checker-board').append('<div id="square-'+position+'" class="square"></div>');
			//$('#checker-board').append('<div id="square-'+position+'" class="square"><p class="number">'+position+'</p></div>');
			
			if ((row%2 == 0 && col%2 != 0) || (row%2 != 0 && col%2 == 0)) 
				$('#square-' + position).addClass('black-square black');
			
			switch (true) {
				case (((row==1 || row==3) && col%2==0) || (row==2 && col%2 != 0)):
					piece = new Piece("light", position);
					break;
				case (((row==6 || row==8) && col%2 != 0) || (row==7 && col%2 == 0)): 
					piece = new Piece("dark", position);
					break;
				default: piece = '';
			}

			if (piece) piece.create();
			board.squares.push(piece);
			squareLeftOffset += squareWidth;
		}
		squareTopOffset += squareHeight;
	}
};

$(function(){
	board.newGame();
});

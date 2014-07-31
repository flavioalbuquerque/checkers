var rowLength = 8;

function init() {
    newGame();

    $('#newGame').click(function() {
        newGame();
    });
}

///////////////////////////////////////////////////
// Init and setup: Begin
///////////////////////////////////////////////////
function newGame() {
    resetGame();

    buildBoard();
    setUpBoard();

    addPieces();
    setUpPieces();
    seInitialPosition();

    countPieces();

    // events
    $('div.piece').click(function() {
        pieceClick($(this));
    });

    $('div.square').click(function() {
        squareClick($(this));
    });
}

function resetGame() {
    $('#board').empty();
    $('#pieces').empty();
    $('span#moveCount').html(0);
}
function buildBoard() {
    var $board = $('#board');
    var squareCount = 64;
    for(var i=0; i<squareCount; i++){
        var $squareDiv = $("<div class='square'></div>");
        $board.append($squareDiv);
    }
}

function countPieces() {
    var lightCount = $('div.piece.light').length;
    var darkCount = $('div.piece.dark').length;
    var $winnerMessage = $('#winnerMessage');

    $('#lightCount').html(lightCount);
    $('#darkCount').html(darkCount);

    // check if we have a winner
    if(lightCount == 0 || darkCount == 0) {
        var $winner = lightCount == 0 ? $('#darkName') : $('#lightName');
        $winnerMessage.html($winner.text() + " wins!");
        $winnerMessage.show(500);
    }
    else {
        $winnerMessage.hide(500);
        $winnerMessage.html("");
    }
}

function addPieces() {
    var $pieces = $("#pieces");
    var pieceCount = 24;

    var $pieceDiv;
    for (var i=0;i<pieceCount;i++){
        $pieceDiv = $('<div class="piece"></div>');
        $pieces.append($pieceDiv);
    }
}

function setUpBoard() {
    // set light and dark squares
    $('div.square').each(function(index,square) {
        var $square = $(square);
        lightOrDark(index) === 1 ? $square.addClass('dark') : $square.addClass('light');
    });
}

// a helper function that takes a number between
// 0 and 63 (inclusive) and returns 1 if the square should be
// dark, and 0 if the square should be light
function lightOrDark(index) {
    var x = index % rowLength;
    var y = Math.floor(index / rowLength);
    var oddX = x % 2;
    var oddY = y % 2;
    return (oddX ^ oddY);
}

function setUpPieces() {
    $('div.piece:even').addClass('light');
    $('div.piece:odd').addClass('dark');
}

function seInitialPosition() {
    // TODO: Make side of light and dark pieces configurable
    // light pieces moves down, dark pieces moves up
    setPiecesInitialPosition('div.piece.light', 0); // up
    setPiecesInitialPosition('div.piece.dark', 5); // down
}

function setPiecesInitialPosition(divPieceType, yIndex) {
    $(divPieceType).each(function(index,piece) {
        //turning the index (from 0 - 11)
        var y = Math.floor(index / 4) + yIndex;
        var x = (index % 4) * 2 + (1 - y%2);

        var pixelPosition = getPixels(x,y);

        // initial position
        movePieceTo($(piece),pixelPosition.top,pixelPosition.left);
    });
}
///////////////////////////////////////////////////
// Init and setup: End
///////////////////////////////////////////////////

///////////////////////////////////////////////////
// In-game: Begin
///////////////////////////////////////////////////
function pieceClick($piece) {
    toggleSelect($piece);
    resetMovables();

    //get the allowed moves for this piece
    if ($piece.hasClass('selected'))
        getMovableSquares($piece).addClass('movable');
}

function squareClick($square) {
    if (!$square.hasClass('movable'))
        return;

    var $selectedPiece = $('div.piece.selected');

    // only 1 piece can be selected
    if ($selectedPiece.length != 1)
        return;

    // square index to pixel position
    var index = $square.prevAll().length;
    var x = index % rowLength;
    var y = Math.floor(index / rowLength);
    var pixels = getPixels(x,y);

    movePieceTo($selectedPiece, pixels.top,pixels.left);

    //.prevAll().length is a trick to get the index of the selected piece
    checkKing($selectedPiece,$square.prevAll().length);

    handleCapturedPieces($square);

    incrementMoveCount();

    $selectedPiece.removeClass('selected');

    resetMovables();
}

function toggleSelect($piece) {
    if ($piece.hasClass('selected')) {
        $piece.removeClass('selected');
    } else {
        // remove all pieces marked as selected
        $('div.piece').removeClass('selected');
        $piece.addClass('selected');
    }
}

function movePieceTo($piece,newTop,newLeft) {
    $piece.css('top',newTop);
    $piece.css('left',newLeft);
}

function resetMovables() {
    $('div.square').removeData('jumpedPieces').removeClass('movable');
}

// this function should get the jQuery object stored in
// the data object of $square under the key 'jumpedPieces'
// it should remove every element in that jQuery selection
function handleCapturedPieces($square) {
    $square.data('jumpedPieces').remove();
    countPieces();
}

function checkKing($piece,squareIndex) {
    // TODO: If piece has a side configured, there will be no need to check both sides, only opposite side
    // check if piece is in first or last set of rows
    if (squareIndex < 8 || squareIndex > 55)
        $piece.addClass('king');
}

function incrementMoveCount() {
    var curMoveCount = parseInt($('#moveCount').html(),10);
    curMoveCount++;
    $('span#moveCount').html(curMoveCount);
}
///////////////////////////////////////////////////
// In-game: End
///////////////////////////////////////////////////

///////////////////////////////////////////////////
// Utilities: Begin
///////////////////////////////////////////////////
// TODO: Put into square class
var width = 46;
var border = 2;

// TODO: Put into square class
// converts x,y coordinate into pixel
// square in the upper left is at position 0,0
// square in the the lower right is at 7,7
function getPixels(x,y) {
    return {
        'top':  (y * (width+border))+'px',
        'left': (x * (width+border))+'px'
    };
}

// TODO: Put into square class
// converts pixel into x,y coordinate
//it follows the same coordinate convention as getPixels
function getCoords(top,left) {
    return {
        'x': left / (width + border),
        'y': top / (width + border)
    };
}

// returns the set of allowed moves given a piece
// SIDE EFFECT: stores jumped pieces in a data element
// of each square that can be moved to
function getMovableSquares($piece) {
    // all squares
    var $squares = $('div.square');

    // select the occupied ones using the jQuery map() method
    // map creates a new object from an existing one
    // using a translation function
    var takenSquares = {};
    $('div.piece').each(function(index,piece) {
        //this function translates a piece
        var position = $(piece).position();
        var coords = getCoords(position.top,position.left);
        var squareIndex = coords.y * rowLength + coords.x;
        takenSquares[squareIndex] = $(piece);
    });

    var coords = getCoords($piece.position().top,$piece.position().left);

    //lights move down
    var lightVectors = [
        {x:1,y:1},
        {x:-1,y:1}
    ];

    //darks move up
    var darkVectors = [
        {x:1,y:-1},
        {x:-1,y:-1}
    ];

    //kings move any which way
    var kingVectors = lightVectors.concat(darkVectors);


    var vectors;
    if ($piece.hasClass('king')) {
        vectors = kingVectors;
    } else if ($piece.hasClass('light')) {
        vectors = lightVectors;
    } else {
        vectors = darkVectors;
    }

    var outOfBounds = function(coords) {
        return !(coords.x >= 0 && coords.x < rowLength && coords.y >= 0 && coords.y < rowLength);
    };

    var $legalSquares = $();
    var buildMoves = function(coords,vectors,jumpsOnly) {


        if (outOfBounds(coords)) return;

        //our current square is at coords
        var $currentSquare = $squares.eq(coords.y*rowLength + coords.x);

        $.each(vectors,function(index,vector) {


            var newCoords = {
                x:vector.x + coords.x,
                y:vector.y + coords.y
            };


            if (outOfBounds(newCoords)) return;


            var newSquareIndex = rowLength*newCoords.y + newCoords.x;
            //if the square is taken,
            if (takenSquares[newSquareIndex]) {
                //it gets interesting
                //ok - so we can only jump if their
                //piece is different from ours
                if ($piece.hasClass('dark')) {
                    if (takenSquares[newSquareIndex].hasClass('dark')) return;
                } else {
                    if (takenSquares[newSquareIndex].hasClass('light')) return;
                }


                var jumpCoords = {
                    x: vector.x*2 + coords.x,
                    y: vector.y*2 + coords.y
                };
                if (outOfBounds(jumpCoords)) return;

                var jumpSquareIndex = jumpCoords.y*rowLength + jumpCoords.x;
                var $newSquare;
                //if the jump square is free...
                //add it and the data-jumped-pieces
                if (!takenSquares[jumpSquareIndex]) {
                    $newSquare = $squares.eq(jumpSquareIndex);
                    //if we haven't already seen it
                    if (!$newSquare.is($legalSquares)) {

                        //add the passed over square to it
                        $legalSquares = $legalSquares.add($newSquare);

                        //and the jumped squares from how we got here
                        var $jumpedPieces = takenSquares[newSquareIndex];
                        if ($currentSquare.data('jumpedPieces')) {
                            $jumpedPieces = $jumpedPieces.add($currentSquare.data('jumpedPieces'));
                        }
                        $newSquare.data('jumpedPieces',$jumpedPieces);

                        //and recurse, with jumpsOnly set to true
                        buildMoves(jumpCoords,vectors,true);
                    }
                }
            } else if (!jumpsOnly) {
                $newSquare = $squares.eq(newSquareIndex);
                $newSquare.data('jumpedPieces',$());
                $legalSquares = $legalSquares.add($newSquare);
            }

        });
    };
    buildMoves(coords,vectors,false);
    return $legalSquares;
}
///////////////////////////////////////////////////
// Utilities: End
///////////////////////////////////////////////////

$('document').ready(function() {
    init();
});

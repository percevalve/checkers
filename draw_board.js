
var drawBoard = function(board,divSelector,rules) {
    output = {};
    var cellNumber = board.size();
    var pixelWidth = PIXEL_WIDTH;
    var pixelHeight = PIXEL_HEIGHT;
    var cellWidth = Math.floor(pixelWidth/cellNumber);
    var cellHeight = Math.floor(pixelHeight/cellNumber);
    var pixelPaddingX = Math.floor(pixelWidth/cellNumber);
    var pixelPaddingY = Math.floor(pixelWidth/cellNumber);
    pixelWidth = cellWidth * cellNumber;
    pixelHeight = cellHeight * cellNumber;
    var boardCanvas;
    var arrowCanvas;
    var angle = 0;
    var zIndexBoard = 9;
    var zIndexCheckers = 10;
    var zIndexArrow = 11;
    var zIndexMovingCheckers = 12;
    var currentTurn;
    var lastPlayedTurn;


    output.moveList = [];
    output.boardState = [];
    output.allMyCheckers = [];
    for(i=0;i<cellNumber;i++){output.allMyCheckers[i] = []};

    var myChecker = function(checker){
        var filename = "graphics/" + checker.color + "-";
        filename += checker.isKing ? "king" : "piece";
        filename += ".png";
        // var theImage = $("<img>").attr("src",filename)
        //                          .prop("width",cellWidth)
        //                          .prop("height",cellHeight);
        var theChecker = $("<div>").css('background-image', 'url(' + filename + ')')
                                    .css("background-size", "contain")
                                    .css("background-repeat","no-repeat")
                                    //.css("background-position","1px 1px")
                                    .css("width",cellWidth)
                                    .css("height",cellHeight)
                                    .attr('class',"overlay")
                                    .css("left",checker.col*pixelPaddingX).css("top",checker.row*pixelPaddingY);
        //theImage.appendTo(theChecker);
        return theChecker;
    }


    output.init = function(){
        currentTurn = -1;
        $($(divSelector).find("canvas")).remove();
        $($(divSelector).find("div")).remove();
        $("#content").css("width",pixelWidth)
                     .css("height",pixelHeight);
        boardCanvas = $("<canvas>");
        arrowCanvas = $("<canvas>").attr("class","overlay");
        boardCanvas.prop("width",pixelWidth)
                   .prop("height",pixelHeight)
                   .css("width",pixelWidth)
                   .css("height",pixelHeight)
                   .css("z-index",zIndexBoard)
                   .appendTo($(divSelector));
        arrowCanvas.css("top","0px")
                   .css("left","0px")
                   .prop("width",pixelWidth)
                   .prop("height",pixelHeight)
                   .css("width",pixelWidth)
                   .css("height",pixelHeight)
                   .appendTo($(divSelector))
                   .css("z-index",zIndexArrow);
        b = boardCanvas[0].getContext('2d');
        
        b.fillStyle = "rgb(255,255,255)";
        for(i=0;i<cellNumber;i++){
            //create the empty array
            for(j=0;j<cellNumber;j++){
                if((i+j)%2 === 0){
                    position = positionMe(i,j);
                    b.fillRect(position.x, position.y, position.width ,position.height); 
                }
            }
        }
        

        boardCanvas.mousedown(function(event){
            var theOffset = getOffset(boardCanvas,event);
            var theCoordinates = getCoordinates(theOffset);
            var theChecker = output.allMyCheckers[theCoordinates.row][theCoordinates.col];

            theChecker.checker = board.getCheckerAt(theCoordinates.row,theCoordinates.col);

            if(directionOf(whoseTurn) === directionOf(theChecker.checker.color)) {
                var theCheckerChangeObject = applyChange(theChecker,theCoordinates.col,theCoordinates.row,theOffset);
                event.preventDefault();
                theCheckerChangeObject.change(theOffset);
                boardCanvas.mousemove(function(event){
                    theCheckerChangeObject.change(getOffset(boardCanvas,event));
                });
                boardCanvas.mouseup(function(event){
                    event.preventDefault();
                    boardCanvas.unbind("mousemove");
                    var finalOffset = getOffset(boardCanvas,event);
                    var finalCoordinates = getCoordinates(finalOffset);
                    if(rules.makeMove(theChecker.checker, directionOf(whoseTurn), 
                                      directionOf(theChecker.checker.color), 
                                      finalCoordinates.row, finalCoordinates.col) === null){
                        theCheckerChangeObject.backHome();                    
                    }
                    theCheckerChangeObject.finish();
                    boardCanvas.unbind("mouseleave");
                    boardCanvas.unbind("mouseup");
                 });
                 boardCanvas.mouseleave(function(event){
                    $(document).mouseup(function(event){boardCanvas.trigger("mouseup")});
                });
            }
        });
        output.getCheckers();

    }

        //do some coalesence on the move of the mouse.

    var applyChange = function(object,col,row,initialMouseOffset,anim){
        var that = {};
        var initialRow = row;
        var initialCol = col;
        var initialXOffset = parseInt(object.css("left")) - initialMouseOffset.x;
        var initialYOffset = parseInt(object.css("top"))  - initialMouseOffset.y;

        var x ;
        var y ;
        var aTimerIsSet = 0 ;
        var lagTime = 50;
        var animationMove = (typeof anim === "undefined") ? 20 : anim;
        object.css("z-index",zIndexMovingCheckers);
        that.change = function(offset){
            x = offset.x;
            y = offset.y;
            if(aTimerIsSet === 0){
            //move the cursor
            that.doIt();
            aTimerIsSet = setTimeout(function(){
                    aTimerIsSet = 0;
                    that.doIt();
                },lagTime)
            }
        }

        that.doIt = function(){
            var cornerX = x  + initialXOffset;
            var cornerY = y  + initialYOffset; 

            object.animate({ "left": cornerX , "top":cornerY }, animationMove);
            //object.css({ "left": x , "top":y });
        }

        that.backHome = function(){
            var initialPos = positionMe(initialCol,initialRow);
            object.animate({ "left": initialPos.x , "top":initialPos.y }, animationMove * 4 );
        }

        that.finish = function(){
            clearTimeout(aTimerIsSet);
            object.css("z-index",zIndexCheckers);
        }
        return that;
    }

    var positionMe = function(col,row){
        var output = {};
        output.x = col*pixelPaddingX;
        output.y = row*pixelPaddingY;
        output.width = cellWidth;
        output.height = cellHeight;
        output.centerX = col*pixelPaddingX + output.width/2;
        output.centerY = row*pixelPaddingY + output.height/2;
        return output;
    }




    output.getCheckers = function(completeBoard){
        var theCheckers = (typeof completeBoard === "undefined") ? board.getAllCheckers() : completeBoard;
        //delete all the previous images.
        for(i=0;i<cellNumber;i++){
            for(j=0;j<cellNumber;j++){
                if(typeof output.allMyCheckers[i][j] !== "undefined"){
                    output.allMyCheckers[i][j].remove();
                }
            }
        }
        output.allMyCheckers = [];
        for(i=0;i<cellNumber;i++){output.allMyCheckers[i] = []};
        theCheckers.forEach(function(e){output.allMyCheckers[e.row][e.col] = myChecker(e)});
        output.showCheckers();
    }

    output.addChecker = function(event){
        output.allMyCheckers[event.details.row][event.details.col] = myChecker(event.details.checker).appendTo(divSelector);
    }

    output.moveChecker = function(event){
        recordMove = true;
        currentTurn++;
        lastPlayedTurn = currentTurn;
        moveRecord(whoseTurn,event.details);
        showMove(event.details);
        output.allMyCheckers[event.details.toRow][event.details.toCol] = output.allMyCheckers[event.details.fromRow][event.details.fromCol];
        output.allMyCheckers[event.details.fromRow][event.details.fromCol] = undefined;
        var initialPos = positionMe(event.details.toCol,event.details.toRow);
        output.allMyCheckers[event.details.toRow][event.details.toCol].animate({ "left": initialPos.x , "top":initialPos.y }, 200 );
    }

    output.removeChecker = function(event){
        output.allMyCheckers[event.details.row][event.details.col].detach();
        output.allMyCheckers[event.details.row][event.details.col] = undefined;
        if(recordMove){
            moveRecord();
        }
    }



    var changeHistory = function(turnRef){
        recordMove = false;
        //output.getCheckers(output.boardState[turnRef-1]);
        showMove(output.moveList[turnRef].details);
        board.clear();
        console.log(turnRef);
        
        output.boardState[turnRef].forEach(function(e){
            var chk = new Checker(e.color, e.isKing);
            board.add(chk,e.row,e.col)
        });
        whoseTurn = toggleTurn(output.moveList[turnRef].color);
    }

    output.undoLastMove = function(){
      if(currentTurn ===  0)
      {
        $("#btnNewGame").trigger("click");
      }
      else{
        currentTurn = currentTurn-1;
        changeHistory(currentTurn);
      }
    }

    output.redoLastMove = function(){
        currentTurn = currentTurn+1;
        changeHistory(currentTurn);
    }

    var showMove = function(details){
        var origin = positionMe(details.fromCol, details.fromRow);
        var destination = positionMe(details.toCol, details.toRow);
        drawArrow(origin,destination);
    }


    output.showCheckers = function(){
        for(i=0;i<cellNumber;i++){
            for(j=0;j<cellNumber;j++){
                if(typeof output.allMyCheckers[i][j] !== "undefined"){
                output.allMyCheckers[i][j].appendTo(divSelector);
                }
            }
        }
    }


    var moveRecord = function(whoseTurn,details){
        if(recordMove){
            if(typeof details !== "undefined"){
                output.moveList[currentTurn] = {"color":whoseTurn,"details":details};
            }   
            var theBoard = [];
            output.boardState[currentTurn] = undefined;
            board.getAllCheckers().forEach(function(e){
                var checkersInfo = {row: e.row, col:e.col, color: e.color, isKing: e.isKing};
                theBoard.push(checkersInfo);
            });
            output.boardState[currentTurn] = theBoard;
        }
    }


    // http://stackoverflow.com/questions/12704686/html5-with-jquery-e-offsetx-is-undefined-in-firefox
    var getOffset = function(object,e){
      if( typeof e.offsetX === "undefined"){
        xpos = e.pageX-object.offset().left;
        ypos = e.pageY-object.offset().top;
        }             
      else{ 
        xpos = e.offsetX;
        ypos = e.offsetY;
        }
      return {"x" : xpos, "y" : ypos};
    }

    var getCoordinates = function(offset){
        var row = Math.floor(offset.y/cellHeight);
        var col = Math.floor(offset.x/cellHeight);
        return {"col" : col, "row" : row};
    }
 
    var drawArrow = function(origin,destination){
        var c = arrowCanvas[0].getContext('2d');
        var triangleBase = Math.floor(cellWidth / 5 * 3);
        var triangleHeight = Math.floor(cellWidth / 5 * 2) ;
        c.strokeStyle = "rgb(255,255,0)";
        c.fillStyle = "rgb(255,255,0)";
        c.lineWidth=2;
        //Restting the canvas to 0, using http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, arrowCanvas[0].width, arrowCanvas[0].height);
        //Rotating the canvas
        c.translate(origin.centerX,origin.centerY);
        var angle = Math.atan((destination.centerY-origin.centerY)/(destination.centerX - origin.centerX));
        angle = ((destination.centerX - origin.centerX) < 0) ? angle + Math.PI : angle;
        c.rotate(angle);
        c.translate(-origin.centerX,-origin.centerY)
        //Begin drawing the arrow
        c.beginPath();
        var arrowLength = Math.floor(Math.sqrt(Math.pow((origin.centerX-destination.centerX),2)+Math.pow((origin.centerY-destination.centerY),2)))
        c.moveTo(origin.centerX,origin.centerY);
        var arrowHeadX =  origin.centerX + arrowLength;
        c.lineTo(arrowHeadX,origin.centerY);
        c.lineTo(arrowHeadX-triangleHeight,origin.centerY-triangleBase/2);
        c.lineTo(arrowHeadX,origin.centerY);
        c.lineTo(arrowHeadX-triangleHeight,origin.centerY+triangleBase/2);
        c.stroke();  
    }

    output.isUndoPossible = function(){
        if(currentTurn>=0 && output.boardState.length > 0){
            return false;
        }
        else{
            return true;
        }
    }

    output.isRedoPossible = function(){
        if(currentTurn<lastPlayedTurn){
            return false;
        }
        else{
            return true;
        }
    }

    output.checkUI = function(){
            // for (var r in output.allMyCheckers) {
            //     for (var c in output.allMyCheckers[r]) {
            //         if (output.allMyCheckers[r][c]) {
            //             checker = output.allMyCheckers[r][c];
            //             pos = getCoordinates({x: checker.css("left") , y: checker.css("top")});
            //             assertTrue(pos.row == r && pos.col == c, "Board representation invariant broken, at " + r + "," + c + "!=" + pos.row + "," + pos.col);
            //             boardChecker = board.getCheckerAt(r,c);
            //             assertTrue(boardChecker, "Board representation invariant broken, at " + r + "," + c + " not in board");
            //         }
            //     }
            // }
        }

    function assertTrue(f, s){
        if (!f) {
            console.log(s);
        }
    }


    return output;
}
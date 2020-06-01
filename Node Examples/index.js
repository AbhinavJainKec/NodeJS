var rect = require('./rectangle');

function solveRect(l,b) {
    console.log("Solving For Rectangle With L = " + l + " and B = " + b);

    rect(l, b, (err, rectangle) => {
        if (err) {
            console.log("ERROR: ", err.message);
        }
        else {
            console.log("The Area Of The Rectangle Of Dimensions L = " + l + " And B = " + b + " Is " + rectangle.area());
            console.log("The Perimeter Of The Rectangle Of Dimensions L = " + l + " And B = " + b + " Is " + rectangle.perimeter());
        }
    });
    console.log("This Statement After The Call To Rect()");
};

solveRect(2,4);
solveRect(3,5);
solveRect(0,5);
solveRect(-3,5);
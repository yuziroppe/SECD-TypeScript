var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
(function () {
    var ENTER_KEY = 13;
    var MySecd = function () {
        var id = 1;
        var txtInput = document.getElementById("txtInput");
        var divResults = document.getElementById("divResults");
        var codeDetails = {
            author: "Yujiro Yahata",
            course: "Computational Model Theory",
            sem: "Spring 2020",
            date: "31th August, 2020",
            college: "Keio University"
        };
        var DomOperations = function () {
            txtInput.onkeypress = function (e) {
                if (e.keyCode === ENTER_KEY) {
                    console.log("--- Begin SECD ---");
                    console.log(txtInput.value);
                    var code = parseCode(txtInput.value);
                    var result = executeSECD(code, {});
                    divResults.innerHTML = result;
                    console.log("--- End SECD ---");
                }
            };
        };
        // ex: app:{func:{arg:'x',body:'x'},var:{name:'a',val:3}}
        var parseCode = function (inputCode) {
            console.log("input val: ", inputCode);
            var strAst = "return {" + inputCode + "};";
            var astObject = Function(strAst)();
            console.log("input ast: ", astObject);
            return astObject;
        };
        var executeSECD = function (code, env) {
            var secd = { S: new Array(), E: env, C: [code], D: new Array() };
            while (secd.C.length) {
                secdLogger(secd);
                // define2: if head C is variable
                if (secd.C[secd.C.length - 1]["var"] !== undefined) {
                    console.log("Def2");
                    secd = executeDefTwo(secd);
                }
                else if (secd.C[secd.C.length - 1].func !== undefined) {
                    console.log("Def3");
                    secd = executeDefThree(secd);
                }
                else if (secd.C[secd.C.length - 1] === "ap") {
                    if (secd.S[secd.S.length - 1].closure !== undefined) {
                        console.log("Def4");
                        secd = executeDefFour(secd);
                    }
                    else {
                        console.log("Def5");
                        secd = executeDefFive(secd);
                    }
                }
                else {
                    // application: app: {}
                    console.log("Def6");
                    secd = executeDefSix(secd);
                }
            }
            // C is Empty
            // Define1: (S, E, [], (S1, E1, C1, D1)) -> (S.pop():S1, E1, C1, D1)
            while (secd.D.length) {
                console.log("Def1");
                secdLogger(secd);
                secd = executeDefOne(secd);
            }
            return secd.S.pop();
        };
        // (S, E, C, D) -> (hs:S', E', C, D')
        // where S', E', C, D' = D
        var executeDefOne = function (secd) {
            var d = secd.D.pop();
            var newS = d.S;
            var newE = d.E;
            var newD = d.D;
            // 次の状態でもうsecd.Sは関係ない
            newS.push(secd.S.pop());
            return { S: newS, E: newE, C: secd.C, D: newD };
        };
        // Cの頭が変数である
        // (location EXE:S, E, tC, D)
        var executeDefTwo = function (secd) {
            var newS = secd.S;
            var newE = secd.E;
            var newD = secd.D;
            // headCは{name, val}という情報を持つ
            // S -> location EXE:S
            // C -> tl C
            // ex: headC = {var: {name: 'a', val: 2}}
            var headC = secd.C.pop();
            var newC = secd.C;
            if (headC["var"].name in Object.keys(secd.E)) {
                // 環境Eの値を
                var newHeadC = __assign(__assign({}, headC), { "var": { val: secd.E[headC.name] } });
                newS.push(newHeadC);
            }
            else {
                // 値をそのまま
                newS.push(headC);
            }
            return { S: newS, E: newE, C: newC, D: newD };
        };
        // hd Cがラムダ式のとき
        var executeDefThree = function (secd) {
            var newS = secd.S;
            var newE = secd.E;
            var newD = secd.D;
            // C -> tl C
            // ex: headC = {func: {arg: 'x', body: 'x'}}
            var headC = secd.C.pop();
            var newC = secd.C;
            // closureをpush: {func, env}
            newS.push({ closure: __assign(__assign({}, headC), { env: secd.E }) });
            return { S: newS, E: newE, C: newC, D: newD };
        };
        // hd Cが記号'ap'かつhd Sが環境E1っと束縛変数bv Xとを持ったclosureのとき
        var executeDefFour = function (secd) {
            // ex: firstS = {closure: {func: {arg: 'x', body: 'x'}, env: {}}
            var firstS = secd.S.pop();
            var e1 = firstS.closure.env;
            var arg = firstS.closure.func.arg;
            var body = firstS.closure.func.body;
            // derive(assoc(bv X, 2nd S)) :E1
            // ex: secondS = {var: {name: 'a', val: 2}}
            var secondS = secd.S.pop();
            var newE = e1;
            newE[arg] = secondS["var"];
            var firstC = secd.C.pop();
            var newS = [];
            var newC = [{ "var": { name: body, val: undefined } }];
            var newD = [{ S: secd.S, E: secd.E, C: secd.C, D: secd.D }];
            return { S: newS, E: newE, C: newC, D: newD };
        };
        // hd Cが記号'ap'かつhd Sがclosureでないとき
        // (S, E, C, D) -> (((1st S)(2nd S):tl(tl S)), E, tl C, D)
        var executeDefFive = function (secd) {
            // ((1st S)(2nd S):tl(tl S))ってSと変わんなくね
            var newS = secd.S;
            var newE = secd.E;
            secd.C.pop();
            var newC = secd.C;
            var newD = secd.D;
            return { S: newS, E: newE, C: newC, D: newD };
        };
        var executeDefSix = function (secd) {
            var newS = secd.S;
            var newE = secd.E;
            var newD = secd.D;
            // ex: headC = {app: {func: {}, var: {}}}
            var headC = secd.C.pop();
            secd.C.push("ap");
            secd.C.push({ func: headC.app.func });
            secd.C.push({ "var": headC.app["var"] });
            var newC = secd.C;
            return { S: newS, E: newE, C: newC, D: newD };
        };
        var secdLogger = function (secd) {
            console.log("------ SECD Logger Start ------");
            // S
            console.log("--- S Start ---");
            secd.S.forEach(function (element, index) { return console.log(JSON.stringify(element)); });
            console.log("--- S End ---");
            // E
            console.log("--- E Start ---");
            console.log(JSON.stringify(secd.E));
            console.log("--- E End ---");
            // C
            console.log("--- C Start ---");
            secd.C.forEach(function (element, index) { return console.log(JSON.stringify(element)); });
            console.log("--- C End ---");
            // D
            console.log("--- D Start ---");
            secd.D.forEach(function (element, index) { return console.log(JSON.stringify(element)); });
            console.log("--- D End ---");
            console.log("------ SECD Logger End ------");
        };
        return {
            init: DomOperations,
            credit: codeDetails
        };
    };
    window.onload = function () {
        var secd = MySecd();
        secd.init();
        console.log(secd.credit);
    };
})();

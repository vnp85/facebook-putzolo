// ==UserScript==
// @name         facebook putzolo
// @namespace    http://csillagtura.ro/less-facebook-suggestions-userscript
// @version      2017.03.19. 01:37
// @description  hides facebook dom elements like the annoying suggested posts/pages/people, needs fb to be in english
// @author       VNP
// @match        https://*.facebook.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /* 
    TIME
    taking over the timeouts and intervals,
    preventing loss of control
    */

    var putzoloInterval = -1;
    var putzoloIntervalGuard = -1;
    var kliorInterval = window.clearInterval;
    var kliorTimeout = window.clearTimeout;
    var inPutzoloMain = 0;
    var putzolo_counter = false;
    var putzolo_ticker  = false;
    var putzolo_ticker_style = false;
    
        
    function getSafeIntervalClearer(p){
        var f = function(intervalId) {
            // preventing the page from restoring the original function
            //console.log("clear "+p+" called by fb ", intervalId);
            if( typeof intervalId === 'undefined'){
                return undefined;
            }
            if (intervalId){ 
                if ((intervalId != putzoloInterval) && (intervalId != putzoloIntervalGuard)){
                    kliorInterval(intervalId); 
                }else{
                    console.log("clear "+p+" attempt for putzolo: ", intervalId);
                }
            }
            return undefined; 
        };
        f.toString = function (){
            return "function clear"+p+"() { [native code] }";
        };
        return f;
    }
    
    var safeClearInterval1 = getSafeIntervalClearer("Interval");
    var safeClearInterval2 = getSafeIntervalClearer("Timeout");
    
    function putzolo_grabIntervals(){
        if (window.prototype){
           window.prototype.clearInterval = safeClearInterval1;
           window.prototype.clearTimeout = safeClearInterval2;
        };            
        window.clearInterval = safeClearInterval1;
        window.clearTimeout = safeClearInterval2;
    }
    
    putzolo_grabIntervals();
    
    putzoloIntervalGuard = window.setInterval(function (){
        putzolo_grabIntervals();
    }, 1 /* ASAP */ );
    console.log("putzolo inited, intervals guarded");

    
    
    /*
    SIZE    
    the feed might get short - single post - after
    hiding feed elements fitting the criteria.
    execute a click on the more button
    */
    function putzolo_eventFire(el, etype){
      if (el.fireEvent) {
        el.fireEvent('on' + etype);
      } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
      }
    }
    function putzolo_fewPostsVisibleSoClickTheMoreButton(){
        var contCol = document.getElementById("contentCol");
        if (!contCol){
            contCol = document.getElementById("contentArea");
        }
        if (!contCol){
            return ;
        }
        if (contCol.clientHeight < 2000){
            var lista = document.getElementsByTagName("a");
            for (var q=0; q<lista.length; q++){
                 if (lista[q].getAttribute("role") == "button"){
                   if (lista[q].innerHTML.toLowerCase().indexOf("more stories") > -1){
                       putzolo_eventFire(lista[q], "click");
                   }
                 };
            }
        } 
    }

    /*
    
    UI
    
    Include some changes to the UI marking that putzolo has control
    
    */
    var trybb = 100; //10 seconds
    function putzolo_isFBinEnglish(){
        //assuming it is
        var x = document.getElementById("pagelet_bluebar");
        if (!x){
            return true;
        }
        var lista = x.getElementsByTagName("div");
        var listalen = lista.length;
        for (var q=0; q<listalen; q++){
            var lq = lista[q];
            var lqa = lq.getAttribute("data-click");
            if (lqa){
                if (lqa=="home_icon"){
                    if (lq.innerHTML.indexOf("Home") == -1){
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    function putzolo_putUIElements(){        
        var head = document.head || document.getElementsByTagName('head')[0];
        var bb = document.getElementById("pagelet_bluebar");
        if (!bb){
            //facebook has not loaded yet, wait
            trybb--;
            if (trybb > 0){
                setTimeout(function (){
                    putzolo_putUIElements();
                }, 100);
            };                
            return ;
        }
        //some extra css
        var css = ''+
            ' .carouselParent { display: none; }'+
            ' #GroupsRHCSuggestionSection { display: none; } '+
            ' #wekker { position: fixed; left: 0px; top: 0px; width: 10px; height: 10px;} '+
            ' #elements_hidden_by_putzolo { '+
                'z-index: 9999; position: fixed; height: 16px; width: 60px; top: 3px; left: 100%; '+
                'margin-left: -90px; text-align: right; cursor: not-allowed; font-size: 10pt; padding: 3px; '+
            '}'+
            ' #putzolo_ticker { z-index: 9999; position: fixed; left: 0px; top: 0px; height: 6px; width: 6px; overflow: hidden; background-color: yellow}'+
            ' #putzolo_msg { z-index:9999; position: fixed; left: 20px; top: 0px; height: 10px; width: 150px; font-size: 10pt; }'+
            ' ';
        var style = document.createElement('style');    
        style.type = 'text/css';
        if (style.styleSheet){
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
        head.appendChild(style);

        if (bb){
            // this is the main facebook frame
            if (!putzolo_isFBinEnglish()){
                var col = "orange";
                var msg = "the interface should be in english";
            }else{
                var col = "green";
                var msg = "";
            }
            var lista = bb.getElementsByTagName("div");
            for (var q=0; q < lista.length; q++){
                var a = lista[q].getAttribute("role");
                if (a!="dialog"){
                    if (
                        (lista[q].parentNode == bb) || 
                        (lista[q].parentNode.parentNode == bb) || 
                        (lista[q].parentNode.parentNode.parentNode == bb)
                    ){
                        lista[q].style.backgroundColor = col;
                    }                   
                };
            };           
            // lets put in a counter
            var counter = document.createElement("div");
            counter.title = "Elements hidden by putzolo, fb seems to be clearing the localstorage from time to time";
            counter.id = "elements_hidden_by_putzolo"; 
            var pc = localStorage.getItem("putzolo-counter");
            if (!pc){
                pc = "0";
            } 
            counter.innerHTML = pc;            
            document.body.appendChild(counter);

            var ticker = document.createElement("div");
            ticker.id = "putzolo_ticker";
            ticker.innerHTML = "&nbsp;"; 
            document.body.appendChild(ticker);
            
            if (msg!=""){
                var m = document.createElement("div");
                m.id = "putzolo_msg";
                m.innerHTML = msg;
                document.body.appendChild(m);
            }
            putzolo_counter = counter;
            putzolo_ticker  = ticker;
            putzolo_ticker_style = putzolo_ticker.style;
        };        
    };
    
    putzolo_putUIElements();

    /*
    CHEESY
    
    Cats can not be hidden yet, but strings/posts that fit a keyword, can
    
    */
    function putzolo_getTheCheesyPairs(){
        var pairs = [];
        pairs.push({
             killIf:    [
                         "kar"+String.fromCharCode(225)+"csony", 
                         "karacsony"
                        ],
             butKeepIf: [
                         "kar"+String.fromCharCode(225)+"csonyi zsolt", 
                         "kar"+String.fromCharCode(225)+"csony ben", 
                         "zsolt kar", 
                         "karacsony beno", 
                         "csonyi zsolt", 
                         "halmaz" 
                        ]
        })
        pairs.push({
             killIf:    ["christmas"],
             butKeepIf: ["last christmas", "apod", "cluster"]
        })
        pairs.push({
           killIf: [
            String.fromCharCode(252)+"nnepek", 
            "husvet", 
            "h"+String.fromCharCode(250)+"sv"+String.fromCharCode(233)+"t", 
            "happy new year",
            "isten "+String.fromCharCode(233)+"ltessen", 
            "isten eltessen", 
            "boldog szuletesnapot", 
            "boldog sz"+String.fromCharCode(252)+"let"+String.fromCharCode(233)+"snapot", 
            "boldog szulinapot", 
            "boldog sz"+String.fromCharCode(252)+"linapot"
                  ]
        });
        return pairs;
    }
    var chp = putzolo_getTheCheesyPairs();
    
    function putzolo_stringFitsCheesyKeywords(s){
        s = s.toLowerCase();
        var p = chp;        
        for (var q=0; q<p.length; q++){
            var kill = false;
            for (var i=0; i<p[q].killIf.length; i++){
                if (s.indexOf(p[q].killIf[i]) > -1){
                    kill = true;
                }
            }
            if (p[q].butKeepIf){
                for (var i=0; i<p[q].butKeepIf.length; i++){
                    if (s.indexOf(p[q].butKeepIf[i]) > -1){
                        kill = false;
                    }
                }
            }
            if (kill){
                return true;
            }
        }
        
        return false;
    }    
    function putzolo_postFitsCheesyKeywords(d){
        var at = "data-kwchk";
        var a = d.getAttribute(at);
        if (a){
            return (a=="3");
        }else{
            var s = d.innerHTML.split("<"+"form")[0];
            if (putzolo_stringFitsCheesyKeywords(s)){
                d.setAttribute(at, "3");
                return true;
            }else{
                d.setAttribute(at, "2");
                return false;
            }
        }
    }
    
    
    /*
    
    chat list
    
    */
    
    function putzolo_moveElementToTheEndOfTheList(e){
        var li = e;
        for (var q=0; q<10; q++){
            if (li.tagName.toLowerCase() != "li"){
                li = li.parentNode;
            }            
        };
        if (li.tagName.toLowerCase() == "li"){
            var ul = li.parentNode;
            var go = true;
            var k = ul.lastChild;
            for (var g=0; g<5; g++){
                if (li == k){
                    go = false;
                }
                k = k.previousElementSibling;
            }
            if (go){
               ul.removeChild(li);
               ul.appendChild(li);
            }                
        }else{
            e.parentNode.parentNode.opacity = "0.2";
        }
        
    }
    function putzolo_rearrangeTheChatList(){
        var parento = document.getElementsByClassName("fbChatSidebarBody");
        if (parento[0]){
            parento = parento[0];
        }else{
            parento = document;
        }
        var li_k = parento.getElementsByTagName("li");
        for (var i=0; i<li_k.length; i++){
            if (li_k[i].className.indexOf("_42fz") > -1){
                if (!li_k[i].getAttribute("data-id")){
                    li_k[i].style.display = "none";
                }
            }
            var lista = li_k[i].getElementsByTagName("div");
            for (var q=0; q<lista.length; q++){
                var s = lista[q].innerHTML;
                if (s.length < 25){
                    if (s.indexOf("________________") > -1){
                        putzolo_moveElementToTheEndOfTheList(lista[q]);
                    }
                    if (s.indexOf("______________") > -1){
                        putzolo_moveElementToTheEndOfTheList(lista[q]);
                    }
                }
            }
        }

    }
    
    /*
    
    PUTZOLO
    
    Clean up the UI from suggestions etc
    
    */
    
    function putzolo_getToBeHiddenTextList(){
        return [
            "invite friends to like",
            "sponsored",
            "suggested pages",
            "buy and sell groups",
            "sale groups",
            "suggested groups",
            "popular live vid",
            "popular vid",
            "page posts you",
            "you may like",
            "you may also like",
            "improve your news feed",
            "suggested people",
            "people you may know",
            "by writing a review"
        ];
    }
    var ptbhtl = putzolo_getToBeHiddenTextList();
    
    function putzolo_isToBeHiddenJudgingByText(s){
         for (var q =0; q<ptbhtl.length; q++){
             if (s.indexOf(ptbhtl[q]) > -1){
                 return true;
             }
         }
         return false;
    }

    //setting up the interval that cleans the screen   
    putzoloInterval = setInterval(function (){
        putzolo_grabIntervals();
        if (inPutzoloMain > 0){
            return ;
        }
        inPutzoloMain++;
        try {
            putzolo_rearrangeTheChatList();

            var hidden_in_this_round = 0; 
            var lista = document.getElementsByClassName("userContentWrapper");
            var listalen = lista.length;
            for (var q=0; q < listalen; q++){
                var lq = lista[q];
                if (lq.style.display!="none"){
                    if (lq.innerHTML.indexOf("ponsored") > -1){
                        lq.style.display = "none";
                        hidden_in_this_round++;
                    }                
                };
                if (lq.style.display!="none"){
                    if (putzolo_postFitsCheesyKeywords(lq)){
                        lq.style.opacity = 0.3;
                    }
                };            
                if (lq.style.display!="none"){
                    if (lq.innerHTML.indexOf("Connect With Facebook") > -1){
                        lq.style.display = "none";
                        hidden_in_this_round++;
                    }
                };            
            }
            var lista = document.getElementsByTagName("div");
            var listalen = lista.length;
            for (var q = 0; q < listalen; q++){ 
                var lq = lista[q];
                if (lq.style.display!="none"){
                    var elemhandled = false;
                    if (parseInt(lq.getAttribute("data-fte")) == 1){
                        var s = lq.innerHTML.toLowerCase();
                        if ( putzolo_isToBeHiddenJudgingByText(s) ){
                            lq.style.display = "none";
                            hidden_in_this_round++; 
                            elemhandled = true;
                        };
                    }  

                    if (!elemhandled){
                        var a = lq.getAttribute("data-ownerid");
                        if (a){
                            a = String(a);
                            if (a.indexOf("hyper") < 0){
                                var cn = " "+lq.className+" "; 
                                if (
                                    (cn.indexOf(" uiContextualLayerPositioner ") < 0) && 
                                    (cn.indexOf("Photo") < 0)
                                ){ 
                                    if (lq.innerHTML != ""){ 
                                        // lq.style.border = "5px solid orange";
                                        lq.style.display = "none";
                                        hidden_in_this_round++; 
                                    };    
                                };
                            };

                        }
                    }
                }  
            }

            //the favorites on the chat sidebar - they are no favorites, they are people I chat with        
            var lista = document.getElementsByTagName("em"); 
            var listalen = lista.length;        
            for (var q = 0; q < listalen; q++){
                var at = lista[q].getAttribute("data-intl-translation")+"";
                if (at == "FAVORITES"){
                    lista[q].parentNode.style.display = "none";
                }
                if (at.indexOf("MORE CONTACTS") == 0){
                    lista[q].parentNode.parentNode.parentNode.style.display = "none";
                }
            }


            //sidebar on the right
            var lista = document.getElementsByClassName("ego_section");
            var listalen = lista.length;        
            for (var q=0; q < listalen; q++){
                lq = lista[q];
                if (lq.style.display!="none"){
                    var s = lq.innerHTML.toLowerCase();
                    if ( putzolo_isToBeHiddenJudgingByText(s) ){
                        lq.style.display = "none";
                        hidden_in_this_round++;
                    }
                };
            }                

            //install some bloated app
            var lista = document.getElementsByTagName("a");
            var listalen = lista.length;        
            for (var q=0; q < listalen; q++){
                var lq = lista[q];
                if (lq.style.display!="none"){
                    if (lq.href){
                        if (lq.href.indexOf("install_link") > 0){
                            lq.style.display = "none";
                            lq.parentNode.style.display = "none";
                            hidden_in_this_round++;
                        }
                    }
                }
            }

            //for some reason the chat sidebar displays empty entries too
            var lista = document.getElementsByClassName("_42fz");
            var listalen = lista.length;
            for (var q=0; q<listalen; q++){
                var lq = lista[q];
                if (lq.getAttribute("data-id") == ""){
                    lq.style.border="1px solid yellow";
                }
            }

            var lista = document.getElementsByClassName("egoOrganicColumn");
            var listalen = lista.length;
            for (var q=0; q<listalen; q++){
                var lq = lista[q];
                if (lq.style.display!="none"){
                    if (lq.clientHeight < 40){
                        lq.style.display = "none";
                        hidden_in_this_round++;
                    }
                }
            };    
            // show feedback on the UI
            if (hidden_in_this_round > 0){
                if (putzolo_counter){
                    var s = parseInt(putzolo_counter.innerHTML) + hidden_in_this_round;
                    putzolo_counter.innerHTML = s;
                    localStorage.setItem("putzolo-counter", s);                
                }                
            }
            if (putzolo_ticker){
                if (putzolo_ticker_style.backgroundColor == "white"){
                    putzolo_ticker_style.backgroundColor = "black";
                }else{
                    putzolo_ticker_style.backgroundColor = "white";
                }
            }
            putzolo_fewPostsVisibleSoClickTheMoreButton();
       } catch (err){
           console.log("something went on, in the DOM perhaps", err);
       }
       inPutzoloMain--;
    }, 1000);
    
})();
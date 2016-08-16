// ==UserScript==
// @name         facebook putzolo
// @namespace    http://csillagtura.ro/less-facebook-suggestions-userscript
// @version      2016.08.16. 17:24
// @description  hides facebook dom elements like the annoying suggested posts/pages/people
// @author       VNP
// @match        https://www.facebook.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    //some extra css
    var css = '.carouselParent { display: none; } #GroupsRHCSuggestionSection { display: none; } #wekker { position: fixed; left: 0px; top: 0px; width: 10px; height: 10px;}';
    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');    
    style.type = 'text/css';
    if (style.styleSheet){
       style.styleSheet.cssText = css;
    } else {
       style.appendChild(document.createTextNode(css));
    }
    head.appendChild(style);
    
    //making the bar green, to show it's working
    var bb = document.getElementById("pagelet_bluebar");
    if (bb){
       var lista = bb.getElementsByTagName("div");
       for (var q=0; q < lista.length; q++){
              var a = lista[q].getAttribute("role");
              if (a!="dialog"){
                 if (
                       (lista[q].parentNode == bb) || 
                       (lista[q].parentNode.parentNode == bb) || 
                       (lista[q].parentNode.parentNode.parentNode == bb)
                    ){
                        lista[q].style.backgroundColor = "green";
                 }                   
              };
       };           
    };        
    
    /////setting up the interval that cleans the screen   
    setInterval(function (){
        var lista = document.getElementsByClassName("userContentWrapper");
        for (var q=0; q < lista.length; q++){
            if (lista[q].style.display!="none"){
              if (lista[q].innerHTML.indexOf("ponsored") > -1){
                  lista[q].style.display = "none";
              }
            };
        }
        var lista = document.getElementsByTagName("div");
        for (var q = 0; q < lista.length; q++){
            var a = lista[q].getAttribute("data-ownerid");
            if (a){
                a = String(a);
                if (a.indexOf("hyper") < 0){
                   var cn = " "+lista[q].className+" "; 
                   if (
                       (cn.indexOf(" uiContextualLayerPositioner ") < 0) && 
                       (cn.indexOf("Photo") < 0)
                      ){ 
                      if (lista[q].innerHTML != ""){ 
                         // lista[q].style.border = "5px solid orange";
                         lista[q].style.display = "none";
                      };    
                   };
                };
                
            }
        }
        var lista = document.getElementsByClassName("ego_section");
        for (var q=0; q < lista.length; q++){
            if (lista[q].style.display!="none"){
                var s = lista[q].innerHTML.toLowerCase();
                if (
                     (s.indexOf("suggested pages") > -1) ||
                     (s.indexOf("suggested groups") > -1) ||
                     (s.indexOf("people you may know") > -1) ||
                     (s.indexOf("suggested people") > -1)
                   ){
                    lista[q].style.display = "none";
                }
            };
        }
    }, 1000);
})();
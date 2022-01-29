
$(document).ready(function() {
    const a = new Calendar("#calendar")

    if (getCookie("accessToken")){                  //loginIfRemember
        getCurrentUser(a,getCookie("accessToken"))
    }
    
    
    let monthModel = a.createMonthModel()
    a.renderMonth(monthModel)
    a.primaryLoad(monthModel)

    $("#date-month").click( () => {

        $(".month-choice").addClass("month-choice-active")
        
        $(document).on('mouseup',function (e){ // событие клика по веб-документу
            var div = $(".month-choice")

            if (!div.is(e.target) // если клик был не по нашему блоку
                && div.has(e.target).length === 0){
                $(div).removeClass("month-choice-active")
                $(document).off('mouseup')
            }
        })
    })
    addEventOnClassElements(".month-choice-obj", function() {
        monthModel = a.createMonthModel(a.monthModel.model.getFullYear(), a.monthsNames.indexOf( $(this).text() ))
        a.renderMonth(monthModel)
    })

    $("#close-secondary").click( () => {
        if ($("#calendar-cont").hasClass("calendar-full")){
            $("#calendar-cont").removeClass("calendar-full")
            a.renderSecondary()
        } else {
            $("#calendar-cont").addClass("calendar-full")
        }
    })

    $("#date-year").click( () => {

        $(".year-choice").addClass("year-choice-active")
        $("#year-choice-input").val( $("#date-year").text() )

        $(document).on('mouseup',function (e){ // событие клика по веб-документу
            var div = $(".year-choice")

            if (!div.is(e.target) // если клик был не по нашему блоку
                && div.has(e.target).length === 0){
                $(div).removeClass("year-choice-active")
                $(document).off('mouseup')

                changeYear(a)
            }
        })

        document.querySelector("#year-choice-input").onmousewheel = function(event) {
            let val = parseInt($(this).val())
        
            if (event.deltaY == -100) {
                if (val >= 2100)   $(this).val( "2100" )
                else            $(this).val( val+1 )
            } else {
                if (val <= 1990)   $(this).val( "1990" )
                else            $(this).val( val-1 )
        
            }
        }
    })
    $("#year-choice-input").keydown(function(e) {
        if(e.keyCode === 13) {
            changeYear(a)
        }
    })

    $(".nav-chevron:first-child").click( () => {
        a.renderMonth(a.monthModel,"prev")
    })

    $(".nav-chevron:last-child").click( () => {
        a.renderMonth(a.monthModel,"next")
    })

    $("#logo").click( () => {
        monthModel = a.createMonthModel()
        a.renderMonth(monthModel)
        a.selectBlock($(`.calendar-block:nth-of-type(${a.monthModel.currentTime.getDate()+a.monthModel.primaryDayWeek})`))
    })

    $("#login").click( () => {
        
        if ($(".login-form").hasClass("login-form-active")) {
            //sendForm
            //...
            if ($(".input-username").val() == "" ||
                $(".input-password").val() == ""
            ){
                changeLoginState("LoginFormError")
            } else {
                changeLoginState()

                loginUser(a)
            }

        } else {
            $(".login-form").css("display","block")
            setTimeout( () => $(".login-form").addClass("login-form-active"), 50 )
        }
    })
    $("#register-btn").click( () => {
        if ($(".login-form").hasClass("login-form-register")){
            //sendForm register
            //...
            
            if (($(".input-reg-username").val() == "" ||
                $("input[name='reg-form-pass1']").val() == "" ||
                $("input[name='reg-form-pass2']").val() == "")
                ||
                $("input[name='reg-form-pass1']").val() != $("input[name='reg-form-pass2']").val()
            ){
                changeLoginState("RegistrationFormError")
            } else {
                changeLoginState()

                registerNewUser()
            }
            


            
        } else {
            $("#input-login-username").val("")
            $("#input-login-password").val("")
            $("#input-reg-password").val("")

            $(".login-form").addClass("login-form-register")
            $("#register-btn").text("Зарегистрироваться")
        }
            
    } )
    document.querySelectorAll('.password-control').forEach( el => {
        el.onclick = () => {
            if ($(el).hasClass("control-no_view")){
                $(el).siblings("input").attr('type', 'password')
                $(el).removeClass("control-no_view")
            } else {
                $(el).siblings("input").attr('type', 'text')
                $(el).addClass("control-no_view")
            }
        }
    })
    $("#close-login-form").click( () => closeLoginForm() )
    $("#exit-profile").click( () => {
        exitUser(a)
    } )

    $("#control-nav-memory").click( (eve) => {
        $("#control-nav-note").removeClass("control-nav-active")
        $(eve.currentTarget).addClass("control-nav-active")
        
        //func from class
        a.secondaryNavCheck = "memory"
        a.renderMemories()
    })
    $("#control-nav-note").click( (eve) => {
        $("#control-nav-memory").removeClass("control-nav-active")
        $(eve.currentTarget).addClass("control-nav-active")

        //func from class
        a.secondaryNavCheck = "note"
        a.renderNotes()
    })

    document.querySelectorAll(".scroll-time-hour").forEach( el => {
        el.onmousewheel = function(event) {
            let val = parseInt($(this).val())
        
            if (event.deltaY == -100) {
                if (val >= 23)   $(this).val( "00" )
                else            $(this).val( `${val+1}`.length==1?`0${val+1}`:`${val+1}` )
            } else {
                if (val <= 0)   $(this).val( 23 )
                else            $(this).val( `${val-1}`.length==1?`0${val-1}`:`${val-1}` )
        
            }
        }
    } )
    document.querySelectorAll(".scroll-time-minute").forEach( el => {
        el.onmousewheel = function(event) {
            let val = parseInt($(this).val())
        
            if (event.deltaY == -100) {
                if (val >= 59)   $(this).val( "00" )
                else            $(this).val( `${val+1}`.length==1?`0${val+1}`:`${val+1}` )
            } else {
                if (val <= 0)   $(this).val( 59 )
                else            $(this).val( `${val-1}`.length==1?`0${val-1}`:`${val-1}` )
        
            }
        }
    } )

    $("#control-add").click( () => {

        if (getCookie("accessToken") == undefined){
            alert("Сначала надо войти в аккаунт или зарегистрироваться!")
            return
        }
        placeholdersClicks = 0
        placeholdersRandom = randomInteger(1,3)


        $("#popup-add-textarea").text("")
        //$("#popup-add-textarea").attr("placeholder","Новая запись...")

        if (a.secondaryNavCheck == "note") {

            $("#note-popup-cont").removeClass("note-popup-memories")
            $("#note-popup h2").text("- Добавление дела -")

            $("#add-time-hour").val(`${new Date().getHours()}`.length==1?`0${new Date().getHours()}`:`${new Date().getHours()}`)
            $("#add-time-minute").val(`${new Date().getMinutes()}`.length==1?`0${new Date().getMinutes()}`:`${new Date().getMinutes()}`)

            $("#note-popup-cont").css("display","block")
            setTimeout( () => {
                $("#note-popup").css({"opacity":"1","transform":"none"})
            },50 )

        } else {

            $("#note-popup-cont").addClass("note-popup-memories")
            $("#note-popup h2").text("- Добавление воспоминания -")

            $("#memory-time-hour").val(`${new Date().getHours()}`.length==1?`0${new Date().getHours()}`:`${new Date().getHours()}`)
            $("#memory-time-minute").val(`${new Date().getMinutes()}`.length==1?`0${new Date().getMinutes()}`:`${new Date().getMinutes()}`)

            $("#note-popup-cont").css("display","block")
            setTimeout( () => {
                $("#note-popup").css({"opacity":"1","transform":"none"})
                setTimeout( () => {
                    $("#note-popup-memory-time").css({"opacity":"1","left":"75%"})
                 }, 500)
            },50 )

        }
    })

    let placeholdersClicks = 0 //по приколу
    let placeholdersRandom = randomInteger(1,3)
    $("#btn-add").click( () => {

        let text = $("#popup-add-textarea").html()
        console.log(text)

        let time
        if (a.secondaryNavCheck == "note")
            time = [$("#add-time-hour").val(), $("#add-time-minute").val()]
        else
            time = [$("#memory-time-hour").val(), $("#memory-time-minute").val()]
        

        if ($("#popup-add-textarea").html() != "" || $("#popup-add-textarea").html().trim() != ""){
            a.addRecord(text,time)

            closePopup()
        } else {
            alert("Нужно добавить запись")
        }
        /*else {
            $("#popup-add-textarea").val("")
            let placeholders = ["Все-таки надо добавить запись.","Мне кажется тут пусто.", "Может все-таки напишешь что-то?", "Ты думаешь, тут может быть что-то интересное?", "Ладно. Интересный факт: Первые 'ежедневники' имели вид глиняных табличек с нанесенными пиктограммами и имели возраст порядка 7500 лет!"]
            
            if (placeholdersRandom == 3 && placeholdersClicks <= 4) {
                switch (placeholdersClicks){
                    case 0: $("#popup-add-textarea").attr("placeholder",placeholders[0])
                    placeholdersClicks++
                    break
                    case 1: $("#popup-add-textarea").attr("placeholder",placeholders[1])
                    placeholdersClicks++
                    break
                    case 2: $("#popup-add-textarea").attr("placeholder",placeholders[2])
                    placeholdersClicks++
                    break
                    case 3: $("#popup-add-textarea").attr("placeholder",placeholders[3])
                    placeholdersClicks++
                    break
                    case 4: $("#popup-add-textarea").attr("placeholder",placeholders[4])
                    placeholdersClicks++
                    break
                }
                return
            }

            
            if (randomInteger(0,1)) $("#popup-add-textarea").attr("placeholder",placeholders[0])
            else $("#popup-add-textarea").attr("placeholder",placeholders[1])
            
            placeholdersClicks++
        }*/
    })
    $("#btn-back").click( () => {
        closePopup()
    })



    $("#control-delete").click( () => {
        let records
        if (a.secondaryNavCheck == "note"){
            records = document.querySelectorAll(".note")
        } else {
            records = document.querySelectorAll(".memory")
        }

        
        records.forEach( el => {
            if ($(el).children(".record").hasClass("record-deleting")){
                $(el).children(".record").removeClass("record-deleting")
                $(el).off('click')
            } else {
                $(el).children(".record").addClass("record-deleting")
                $(el).on('click', (e) => {
                    if (a.secondaryNavCheck == "note")                 
                        a.deleteNote(null,$(e.currentTarget).find(".state-menu-delete"))
                    else 
                        a.deleteMemory(null,$(e.currentTarget).find(".memory-menu-delete"))
                })
            }
        } )
    })
})

function closePopup(){
    $("#note-popup").css({"opacity":"0","transform":"translateY(-50%)"})
    
    $("#note-popup-memory-time").css({"opacity":"0","left":"50%"})
    setTimeout( () => {
        $("#note-popup-cont").css("display","none")
    },500 )
}

function changeYear(classObj) {
    let formYear = $("#year-choice-input").val()

    if (!isNaN(formYear)) //checkInt
        if (formYear >= 1990 && formYear <= 2100 && formYear != $("#date-year").text()){
            let monthModel = classObj.createMonthModel(formYear, classObj.monthModel.model.getMonth() )
            classObj.renderMonth(monthModel)
        }
    
}

function addEventOnClassElements(className,functionTarget){
    document.querySelectorAll(className).forEach( el => {
        el.onclick = functionTarget
    })
}

function randomInteger(min, max) {
    // случайное число от min до (max+1)
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}

function closeLoginForm() {
    $(".login-form").removeClass("login-form-active")
        setTimeout( () => {
            $('.login-form input[type=checkbox]').prop('checked',false)
            $("#sex-choice label:nth-of-type(1) input").prop("checked",true)
            $("#sex-choice label:nth-of-type(2) input").prop("checked",false)

            $(".input-username").val("")
            $(".input-password").val("")

            $(".input-reg-username").val("")
            $("input[name='reg-form-pass1']").val("")
            $("input[name='reg-form-pass2']").val("")

            $(".login-form").removeClass("login-form-register")
            $("#register-btn").text("Создать новый аккаунт")
            $(".login-form").css("display","none")
        },300 )

    //display login btn
    $("#login").css("display","block")
        setTimeout( () => $("#login").show(), 10 )
}

function registerNewUser() {
    console.log("register")
    $.ajax({
        type: "PUT",
        url: '/user',
        data: {
            username: $(".input-reg-username").val(),
            password: $("input[name='reg-form-pass1']").val(),
            sex: $("#sex-choice label:nth-of-type(1) input").is(':checked')?"male":"female"
        },
        success: function (err,req,resp) {
            console.log(`Добавлен новый пользователь: ${$("input[name='reg-form-pass1']").val()}, ${$("input[name='reg-form-pass2']").val()}`,resp)

            changeLoginState("RegistrationSucces")
        },
        error: function (xhr, textStatus, errorThrown) {
            console.log("При регистрации произошла ошибка!")
            let data = xhr.responseJSON.error
            if (data == "UniqueError")
                changeLoginState("RegistrationError")
            else
                alert("Неизвестная ошибка!")
        }
    })
}

function loginUser(classObj) {
    $.ajax({
        type: "POST",
        url: '/user',
        data: {
            username: $(".input-username").val(),
            password: $(".input-password").val(),
            rememberPassword: $('.login-form input[type=checkbox]').prop('checked')
        },
        success: function (err,req,resp) {
            console.log(`Вошел пользователь`,resp)
            let respUser = resp.responseJSON
            console.log(respUser)

            //rememberToken on ~one month
            setCookie("accessToken",respUser.access_token, {'max-age':2592000})

            joinUser(classObj,respUser.username,respUser.sex)
        },
        error: function (xhr, textStatus, errorThrown) {
            let data = xhr.responseJSON.error
            if (data == "username") {
                console.log("Такого логина не существует")
                changeLoginState("UsernameError")
            }
            if (data == "password") {
                console.log("Неправильный пароль")
                changeLoginState("PasswordError")
            }
            
        }
    })
}

function getCurrentUser(classObj,token){
    $.ajax({
        type: "GET",
        url: '/user',
        headers: {
            "AUTHORIZATION": `Bearer ${token}`
        },
        success: function (err,req,resp) {
            console.log(`Получили текущего пользователя`,resp)
            let respUser = resp.responseJSON
            console.log(respUser)

            //check
            if (respUser.rememberPassword){
                joinUser(classObj,respUser.username,respUser.sex)
            }

        },
        error: function (xhr, textStatus, errorThrown) {
            let data = xhr.responseJSON.error
            if (data == "username") {
                console.log("Такого логина не существует")
                changeLoginState("UsernameError")
            }
            if (data == "password") {
                console.log("Неправильный пароль")
                changeLoginState("PasswordError")
            }
            
        }
    })
}

function joinUser(classObj,username,sex) {
    console.log(classObj)
    //close-form
    $("#login-state").css("opacity","0")
    setTimeout( () =>  $("#login-state").css("display","none"),300)

    closeLoginForm()

    //display profile
    $("#profile-card").css("display","flex")
        setTimeout( () => {
            $("#profile-card").css("transform","none")
                $("#profile-ico").removeClass()
            $("#profile-ico").addClass(`${sex}-ico`)
                $("#profile-name").text(username)
        }, 10)

    //hide login btn
    $("#login").css("transform","translateX(150%)")
        setTimeout( () => $("#login").css("display","none"), 300 )

    //close-form

    classObj.getRecordsfromDB()
    console.log("Вы успешно вошли!")
}

function exitUser(classObj) {
    //display login => hide profile

    $("#profile-card").css("transform","translateX(150%)")
        setTimeout( () => $("#profile-card").css("display","none"), 300 )

    $("#login").css("display","block")
        setTimeout( () => $("#login").css("transform","none"), 10 )  

    classObj.getRecordsfromDB("exit")
    console.log("Вы успешно вышли!")
}

function changeLoginState(state = undefined){
    $("#login-state-btn").on('click', () => {
        $("#login-state").css("opacity","0")
            setTimeout( () =>  $("#login-state").css("display","none"),300)
    })

    $("#login-state").css("display","flex")
        setTimeout( () =>  {
            $("#login-state").css("opacity","1")
        
            switch (state) {
                case "UsernameError": {
                    $("#login-state-btn").css("display","block")
                    $("#login-state-info").text("Такого пользователя не существует")
                    $("#login-state-svg").css("backgroundImage","url('./static/res/error-icon.svg')")
                    break
                }
                case "PasswordError": {
                    $("#login-state-btn").css("display","block")
                    $("#login-state-info").text("Неверный пароль")
                    $("#login-state-svg").css("backgroundImage","url('./static/res/error-icon.svg')")
                    break
                }
                case "LoginFormError":{
                    $("#login-state-btn").css("display","block")
                    $("#login-state-info").text("Заполните поля авторизации!")
                    $("#login-state-svg").css("backgroundImage","url('./static/res/error-icon.svg')")
                    break
                }
                case "RegistrationFormError":{
                    $("#login-state-btn").css("display","block")
                    $("#login-state-info").text("Заполните поля регистрации правильно!")
                    $("#login-state-svg").css("backgroundImage","url('./static/res/error-icon.svg')")
                    break
                }
                case "RegistrationSucces":{
                    $("#login-state-btn").off()
                    $("#login-state-btn").on('click', () => {
                        $("#login-state").css("opacity","0")
                            setTimeout( () =>  {
                                $("#login-state").css("display","none")
                                $(".login-form").removeClass("login-form-register")
                            },300)
                    })

                    $("#login-state-btn").css("display","block")
                    $("#login-state-info").text("Вы успешно зарегистрировались!")
                    $("#login-state-svg").css("backgroundImage","url('./static/res/success-icon.svg')")
                    break
                }
                case "RegistrationError":{
                    $("#login-state-btn").css("display","block")
                    $("#login-state-info").text("Такой пользователь уже существует!")
                    $("#login-state-svg").css("backgroundImage","url('./static/res/error-icon.svg')")
                    break
                }
                case undefined: {
                    $("#login-state-btn").css("display","none")
                    $("#login-state-info").text("Обработка...")
                    $("#login-state-svg").css("backgroundImage","url('./static/res/load-icon.svg')")
                    break
                }
            }

        },50)
}



// возвращает куки с указанным name,
// или undefined, если ничего не найдено
function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}


function setCookie(name, value, options = {}) {

options = {
    // при необходимости добавьте другие значения по умолчанию
    ...options
};

if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
}

let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

for (let optionKey in options) {
    updatedCookie += "; " + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
    updatedCookie += "=" + optionValue;
    }
}

document.cookie = updatedCookie;
}



function deleteCookie(name) {
    setCookie(name, "", {
      'max-age': -1
    })
}
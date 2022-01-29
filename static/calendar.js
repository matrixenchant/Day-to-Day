
Date.prototype.daysInMonth = function() {
    return 33 - new Date(this.getFullYear(),this.getMonth(), 33).getDate()
}

class Calendar {
    constructor(renderTarget){
        this._renderTarget = renderTarget
        this.blockSelected = false
        this.monthModel = {}
        this.monthsNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"]
        this.selectedBlock = ""
        this.dayNotes = new Map()
        this.dayMemories = new Map()
        this.secondaryRecords = []
        this.firstLoad = true
        this.secondaryNavCheck = "note"
    }

    static daysInMonth(date) {return date.daysInMonth()}

    primaryLoad(monthModel) {
        if (this.firstLoad) {

            //markToday
            const today = $(`.calendar-block:nth-of-type(${monthModel.currentTime.getDate()+monthModel.primaryDayWeek})`)
                $(today).addClass("calendar-today")
                this.selectBlock(today)
                //setTimeout( () => {this.updateStateNotes()}, 3000 )
            
            //syncTimerForUpdateStates
            let timeDiff = 60000 - (new Date().getSeconds()*1000 + new Date().getMilliseconds())
            console.log("timediff:",timeDiff)
            setTimeout( () => {
                console.log("timeout: ",new Date(), new Date().getMilliseconds())
                setInterval( () => {
                    this.updateStateNotes()
                    console.log("interval: ",new Date(), new Date().getMilliseconds())
                }
                 ,60000)
            }, timeDiff)

        }
    }

    createMonthModel(year = new Date().getFullYear(), month = new Date().getMonth()){
        const model = new Date( year, month )
        
        const currentTime = new Date()
        const primaryDayWeek = model.getDay()==0?6:model.getDay()-1

        const daysInMonth = model.daysInMonth()
        const prevMonthDays = new Date( model.getFullYear(),model.getMonth()-1 ).daysInMonth()
        const nextMonthDays = 42-(primaryDayWeek+daysInMonth)
        
        this.monthModel = {currentTime:currentTime, primaryDayWeek: primaryDayWeek, daysInMonth: daysInMonth, prevMonthDays: prevMonthDays, nextMonthDays:nextMonthDays, model:model}
        return this.monthModel
    }

    getRecordsfromDB(type = "join"){
        this.dayNotes.clear()
        this.dayMemories.clear()
        console.log("getRecordsFromDB")

        //db  разделение базы данных на два Map: dayMemories и dayNotes

        if (getCookie("accessToken") && type != "exit"){
            $.ajax({
                type: "POST",
                url: '/',
                headers: {
                    "AUTHORIZATION": `Bearer ${getCookie("accessToken")}`
                },
                success: (err,req,resp) => {
                    console.log(resp.responseJSON)
                    
                        resp.responseJSON.forEach( el => {
                            if (el.contentType == "note"){
                                this.dayNotes.set(el.dateKey,{"content": el.content, "complete": el.complete=="true"?true:false})
                            }
                            if (el.contentType == "memory"){
                                this.dayMemories.set(el.dateKey,el.content)
                            }
                        } )
    
                    let monthModel = this.createMonthModel()
                        this.renderMonth(monthModel)
                    this.renderSecondary()
                },
                error: function (xmlHttpRequest, textStatus, errorThrown) {
                    console.log("Ошибка получения данных с БД","Status: " + textStatus + "; ErrorThrown: " + errorThrown)
                }
            })
            
        } else {
            let monthModel = this.createMonthModel()
                this.renderMonth(monthModel)
            this.renderSecondary()
        }

    }
    editMapNotes(data,value){
        this.dayNotes.set(data,value)
    }

    renderMonth(monthModel = this.monthModel, type = "current", selectTarget = undefined){
        if (monthModel.model.getFullYear() <= 1990 && monthModel.model.getMonth() == 0 && type != "next")
            return
        if (monthModel.model.getFullYear() >= 2100 && monthModel.model.getMonth() == 11 && type != "prev")
            return

        if (type == "prev"){
            var fixDate = new Date(monthModel.model.getFullYear(),monthModel.model.getMonth()-1)
            monthModel = this.createMonthModel( fixDate.getFullYear(), fixDate.getMonth() )
        }
        if (type == "next"){
            var fixDate = new Date(monthModel.model.getFullYear(),monthModel.model.getMonth()+1)
            monthModel = this.createMonthModel( fixDate.getFullYear(), fixDate.getMonth() )
        }

        //clearCont
        $(this._renderTarget).empty()

        //display monthName
        $("#date-month").text(this.monthsNames[monthModel.model.getMonth()])
        //display year
        $("#date-year").text(monthModel.model.getFullYear())

        //display blocks
        for (let i = monthModel.prevMonthDays-monthModel.primaryDayWeek+1; i<=monthModel.prevMonthDays; i++){
            $(this._renderTarget).append(this.calendarBlock(i,"calendar-otherMonth"))
        }

        for (let i = 1; i<=monthModel.daysInMonth; i++){
            $(this._renderTarget).append(this.calendarBlock(i))
        }

        for (let i = 1; i<=monthModel.nextMonthDays; i++){
            $(this._renderTarget).append(this.calendarBlock(i,"calendar-otherMonth"))
        }

        

        //addEventsToBlocks
        document.querySelectorAll(".calendar-block").forEach( el => {
            if ( Array.from(el.classList).includes("calendar-otherMonth") ){
                $(el).on("click", (eve) => {this.clickonOtherMonth(eve)})
            } else {
                $(el).on("click", (eve) => {this.clickonMonth(eve)})
            }
        })

        //markSelectedBlock
        if (monthModel.model.getFullYear() == this.selectedBlock.year && monthModel.model.getMonth() == this.selectedBlock.month){
            this.getSelectedBlock().children(".block-bubble").css("transform","translateY(-5vw) scale(1.3,2)")
        }

        //markTodayBlock
        if (monthModel.model.getFullYear() == monthModel.currentTime.getFullYear() && monthModel.model.getMonth() == monthModel.currentTime.getMonth()) {
            const today = $(`.calendar-block:nth-of-type(${monthModel.currentTime.getDate()+monthModel.primaryDayWeek})`)
            $(today).addClass("calendar-today")
        }

        //selectTargetBlock
        if (selectTarget) {
            let targetBlock = this.getSelectedBlock()
            this.selectBlock(targetBlock)
        }


        //markHasNote
        this.checkRecordsforBlock(undefined,this.dayNotes,"calendar-hasNote")
        this.checkRecordsforBlock(undefined,this.dayMemories,"calendar-hasMemory")

        this.checkRecordsforMonth()  

    }
    checkRecordsforMonth() {
        document.querySelectorAll(".month-choice-obj").forEach( el => {$(el).removeClass("month-choice-obj-hasNote"); $(el).removeClass("month-choice-obj-hasMemory")} )
        this.dayNotes.forEach( (value, key, map) => {
            var month = new Date(key).getMonth()
            var year = new Date(key).getFullYear()
            
            if (year == this.monthModel.model.getFullYear()){
                $(`.month-choice-obj:nth-of-type(${month==11?1:month+2})`).addClass("month-choice-obj-hasNote")
            }
            
        })
        this.dayMemories.forEach( (value, key, map) => {
            var month = new Date(key).getMonth()
            var year = new Date(key).getFullYear()
            
            if (year == this.monthModel.model.getFullYear()){
                $(`.month-choice-obj:nth-of-type(${month==11?1:month+2})`).addClass("month-choice-obj-hasMemory")
            }
            
        })
    }
    checkRecordsforBlock(blockdate = undefined, records, className){
        records.forEach( (value, key, map) => {
            let monthModel = this.monthModel
            var noteTime = blockdate==undefined?new Date(key):blockdate
            var prevMonth = new Date(monthModel.model.getFullYear(),monthModel.model.getMonth()-1)
            var nextMonth = new Date(monthModel.model.getFullYear(),monthModel.model.getMonth()+1)
            var currentMonth = new Date(monthModel.model)

            //forBlocks
            if (noteTime.getFullYear() == currentMonth.getFullYear() && noteTime.getMonth() == currentMonth.getMonth()) {
                $(`.calendar-block:nth-of-type(${noteTime.getDate()+monthModel.primaryDayWeek})`).addClass(className)
            }
            if (noteTime.getFullYear() == prevMonth.getFullYear() && noteTime.getMonth() == prevMonth.getMonth() 
                && ( (noteTime.getDate() >= monthModel.prevMonthDays - monthModel.primaryDayWeek) && (noteTime.getDate() <= monthModel.prevMonthDays) ) ) {
                $(`.calendar-otherMonth:nth-of-type(${noteTime.getDate() - (monthModel.prevMonthDays - monthModel.primaryDayWeek)})`).addClass(className)
            }
            if (noteTime.getFullYear() == nextMonth.getFullYear() && noteTime.getMonth() == nextMonth.getMonth() 
                && ( (noteTime.getDate() >= 1) && (noteTime.getDate() <= 42 - (monthModel.primaryDayWeek + monthModel.daysInMonth) ) ) ) {
                $(`.calendar-otherMonth:nth-of-type(${noteTime.getDate() + monthModel.primaryDayWeek + monthModel.daysInMonth})`).addClass(className)
            }
        })
    }


    //HTML BLOCKS
    calendarBlock(day,extraClass = "") {
        return `<div class="calendar-block ${extraClass}">
            <div class="block-day">${day}</div>
            <div class="block-bubble"></div>
            <div class="block-bubble"></div>
            <div class="block-bubble"></div>
        </div>`
    }

    noteBlock(time, content, extraClass = "") {
        return `<div class="note ${extraClass}">
        <div class="record"></div>
        <div class="note-info">
            <div class="note-info-state info-state-time">
                <div class="state-menu">
                    <div class="state-menu-complete state-menu-obj"></div>
                    <div class="state-menu-edit state-menu-obj"></div>
                    <div class="state-menu-delete state-menu-obj"></div>
                </div>
            </div>
            <div class="note-info-time">${time}</div>
        </div>
        <div class="note-content-cont">
            <div class="note-content-background"></div>
            <div class="note-content">${content}</div>
            <div class="note-edit-menu">
                <div class="note-edit-accept"></div>
                <div class="note-edit-reset"></div>
            </div>
        </div>
    </div>`
    }

    memoryBlock(time, content) {
        return `<div class="memory">
                <div class="record"></div>
                    <div style="display: none">${time}</div>
                    <div class="memory-menu-cont">
                        <div class="memory-menu-btns">
                            <div class="memory-menu-edit memory-menu-obj"></div>
                            <div class="memory-menu-delete memory-menu-obj"></div>
                        </div>

                        <div class="memory-menu-ico">
                            <div class="menu-ico-obj"></div>
                            <div class="menu-ico-obj"></div>
                            <div class="menu-ico-obj"></div>
                        </div>                      
                    </div>

                    <div class="memory-edit-menu">
                        <div class="memory-edit-accept"></div>
                        <div class="memory-edit-reset"></div>
                    </div>
                    
                    <div class="memory-content-cont">
                        <div class="note-content-background"></div>
                        <div class="memory-content">${content}</div>
                    </div>
                    <div class="memory-time">${time}</div>
                </div>`
    }

    
    //CLICKBLOCK FUNCTIONS
    clickonOtherMonth(e) {
        let block = e.currentTarget
        let blockDay = parseInt($(block).text())
        if (blockDay > 20) {
            this.selectedBlock = {block: block,year: this.monthModel.model.getFullYear(), month: this.monthModel.model.getMonth(), day: parseInt($(block).text()) }
            this.renderMonth(this.monthModel,"prev",block)
        } else {
            this.selectedBlock = {block: block,year: this.monthModel.model.getFullYear(), month: this.monthModel.model.getMonth(), day: parseInt($(block).text()) }
            this.renderMonth(this.monthModel,"next",block)
        }
        
    }

    clickonMonth(e) {
        this.selectBlock(e.currentTarget)
    }

    getSelectedBlock() {
        return $(`.calendar-block:nth-of-type(${this.selectedBlock.day+this.monthModel.primaryDayWeek})`)
    }

    selectBlock(block){
        if (this.selectedBlock){
            $(this.getSelectedBlock()).children(".block-bubble").css("transform","none")
            this.selectedBlock = {}
        } 
        
        $(block).children(".block-bubble").css("transform","translateY(-5vw) scale(1.3,2)")
        
        this.selectedBlock = {year: this.monthModel.model.getFullYear(), month: this.monthModel.model.getMonth(), day: parseInt($(block).text()) }
        
        //renderSecondary
        if (!$("#calendar-cont").hasClass("calendar-full")){
            this.renderSecondary()
        }
    }

    renderSecondary() {
        $("#secondary-day").text( this.selectedBlock.day )

        let monthName = $("#date-month").text().toLowerCase()
        if (monthName.slice(-1)!="т") monthName = monthName.slice(0,[monthName.length-1]) + "я"
        else monthName = monthName + "а"
    
        $("#secondary-month").text( monthName )

        let selectedBlockDate = new Date(this.selectedBlock.year,this.selectedBlock.month,this.selectedBlock.day)
        let currentDate = new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate())
        if (selectedBlockDate < currentDate) {
            $("#control-nav-note").css("display","none")

            $("#control-nav-memory").addClass("control-nav-active")

            $("#note-popup-memory-time").css("display","block") //right display memory time
        
            this.secondaryNavCheck = "memory"
            this.renderMemories()
    
        } else {
            $("#control-nav-note").css("display","block")
            
            $("#note-popup-memory-time").css("display","none") //right display memory time

            this.selectSection()          
        }
    }

    selectSection() {
        if (this.secondaryNavCheck == "note"){
            $("#control-nav-memory").removeClass("control-nav-active")

            $("#control-nav-note").addClass("control-nav-active")
            this.renderNotes()
        }
        if (this.secondaryNavCheck == "memory"){
            $("#control-nav-note").removeClass("control-nav-active")

            $("#control-nav-memory").addClass("control-nav-active")
            this.renderMemories()
        }
    }

    renderNotes(notes = this.dayNotes) {
        this.secondaryRecords = []
        let secRecSortComplete = []
        let secRecSort = []
        $("#records-cont").empty()

        let completedNotes = []
        let notesForSort = []

        notes.forEach( (value, key, map) => {
            let noteTime = new Date(key)

            if (noteTime.getFullYear() == this.selectedBlock.year && noteTime.getMonth() == this.selectedBlock.month && noteTime.getDate() == this.selectedBlock.day) {
                let hours = `${noteTime.getHours()}`
                    hours = hours.length==1?"0"+hours:hours
                let minutes = `${noteTime.getMinutes()}`
                    minutes = minutes.length==1?"0"+minutes:minutes

                if (value.complete) {
                    let completeBlock = this.noteBlock(`${hours}:${minutes}`,value.content,"info-state-complete")
                    completeBlock = completeBlock.replace(`<div class="state-menu-complete state-menu-obj"></div>`,'')
                    completeBlock = completeBlock.replace(`<div class="state-menu-edit state-menu-obj"></div>`,'')

                    completedNotes.push(completeBlock)
                    secRecSortComplete.push(key)
                    
                } else {
                    notesForSort.push(this.noteBlock(`${hours}:${minutes}`,value.content))
                    secRecSort.push(key)
                }
            }
           
        } )
        
        completedNotes.sort().forEach( el => {
            $("#records-cont").append(el)
        })
        notesForSort.sort().forEach( el => {
            $("#records-cont").append(el)
        })
        this.secondaryRecords = secRecSortComplete.sort().concat( secRecSort.sort() )

        this.updateStateNotes()

        
        //addEventsToNoteBlocks
        document.querySelectorAll(".state-menu-delete").forEach( el => {
            $(el).on("click", (eve) => {this.deleteNote(eve)})
        })
        document.querySelectorAll(".state-menu-edit").forEach( el => {
            $(el).on("click", (eve) => {this.editNote(eve)})
        })
        document.querySelectorAll(".state-menu-complete").forEach( el => {
            $(el).on("click", (eve) => {this.completeNote(eve)})
        })

        if (!$("#records-cont").find('.note').length){
            $("#records-cont").append( "<h1 id='secondary-empty' >Вы пока не добавляли дел</h1>" )
        }
    }

    renderMemories(memories = this.dayMemories) {
        this.secondaryRecords = []
        $("#records-cont").empty()

        let memoriesForSort = []
        let secMemorySort = []

        memories.forEach( (value, key, map) => {
            let memoryTime = new Date(key)

            if (memoryTime.getFullYear() == this.selectedBlock.year && memoryTime.getMonth() == this.selectedBlock.month && memoryTime.getDate() == this.selectedBlock.day) {
                let hours = `${memoryTime.getHours()}`
                hours = hours.length==1?"0"+hours:hours
                let minutes = `${memoryTime.getMinutes()}`
                minutes = minutes.length==1?"0"+minutes:minutes

                let regUrl = /\[[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?\]/gi

                let img = value.match(regUrl)
                
                if (img){
                    img.forEach( el => {
                        el = el.replace('[','')
                        el = el.replace(']','')

                        value = value.replace(/\[[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?\]/i,`<img src="${el}">`)
                    })
                }

                memoriesForSort.push(this.memoryBlock(`${hours}:${minutes}`,value))
                secMemorySort.push(key)
            }
           
        } )

        memoriesForSort.sort().forEach( el => {
            $("#records-cont").append(el)
        })
        this.secondaryRecords = secMemorySort.sort()
        
        //addEventsToNoteBlocks
        document.querySelectorAll(".memory-menu-delete").forEach( el => {
            $(el).on("click", (eve) => {this.deleteMemory(eve)})
        })
        document.querySelectorAll(".memory-menu-edit").forEach( el => {
            $(el).on("click", (eve) => {this.editMemory(eve)})
        })

        if (!$("#records-cont").find('.memory').length){
            $("#records-cont").append( "<h1 id='secondary-empty' >Вы пока не добавляли записей</h1>" )
        }
    }

    updateStateNotes() {

        let notes = document.querySelectorAll(".note") 
        
        if (notes.length) {
            let currentHours = new Date().getHours()
            let currentMinutes = new Date().getMinutes()
            if (currentHours == 23 && currentMinutes == 59)
                setTimeout( () => {this.updateDay()}, 60010)

            for (let note of notes) {
                let date = this.secondaryRecords[ $(note).index() ]

                if (new Date(date).getFullYear() == new Date().getFullYear() &&
                    new Date(date).getMonth() == new Date().getMonth() &&
                    new Date(date).getDate() == new Date().getDate()) {

                    let hours = new Date(date).getHours()
                    let minutes = new Date(date).getMinutes()

                    if (this.dayNotes.get(date).complete)
                        continue
                    
                    if (currentHours > hours || (currentHours == hours && currentMinutes > minutes) ) {
                        $(note).removeClass()
                        $(note).addClass("note")
                        $(note).addClass("info-state-timed_out")
                    } else if ( Math.abs( (hours*60+minutes) - (currentHours*60+currentMinutes) ) <= 60 ) {
                        $(note).removeClass()
                        $(note).addClass("note")
                        $(note).addClass("info-state-time_alarm")
                    } else {
                        $(note).removeClass()
                        $(note).addClass("note")
                        $(note).addClass("info-state-time")
                    }
                } else {
                    if (!this.dayNotes.get(date).complete) {
                        $(note).removeClass()
                        $(note).addClass("note")
                        $(note).addClass("info-state-time")
                    }
                }
                
            }
        }
    }
    updateDay() {
        for (let entry of this.dayNotes) {  //delete notes
            let noteDate = new Date(entry[0])
                noteDate = new Date( noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate() ).valueOf()
            let currentDate = new Date( new Date().getFullYear(), new Date().getMonth(), new Date().getDate() ).valueOf()

            if (noteDate < currentDate) {
                this.dayNotes.delete(entry[0])
                //deleteFromDB
                $.ajax({
                    type: "DELETE",
                    url: '/note',
                    headers: {
                        "AUTHORIZATION": `Bearer ${getCookie("accessToken")}`
                    },
                    data: {
                        recordKey: entry[0]
                    },
                    success: function (err,req,resp) {
                        console.log("Удаление дела",resp)
                    }
                })

            }
            
        }

        this.renderMonth()
    }

    addRecord(text,time) {
        let date = new Date(this.selectedBlock.year, this.selectedBlock.month, this.selectedBlock.day, time[0], time[1]).valueOf()
        
        if (this.secondaryNavCheck == "note") {
            for (let entry of this.dayNotes) {
                if (entry[0] == date && entry[1].content == text){  //full same

                    alert("На это время вы уже добавляли запись!")
                    return
                } else if (entry[0].valueOf() == date) {    //data same
                    
                    alert("На это время вы уже добавляли запись!")
                    return
                }
            }

            this.dayNotes.set(date,{"content": text, "complete": false})
            //addToDB(note)
            let noteToDB = {
                dateKey: date,
                contentType: "note",
                content: text,
                complete: 'false'
            }
            $.ajax({
                type: "PUT",
                url: '/note',
                headers: {
                    "AUTHORIZATION": `Bearer ${getCookie("accessToken")}`
                },
                data: noteToDB,
                success: function (err,req,resp) {
                    console.log("Добавление дела",resp)
                },
                error: function (xmlHttpRequest, textStatus, errorThrown) {
                    console.log("Ошибка добавления дела", xmlHttpRequest)
                }
            })

            this.renderNotes()
            this.checkRecordsforBlock(new Date(this.selectedBlock.year,this.selectedBlock.month,this.selectedBlock.day),this.dayNotes,"calendar-hasNote")

        } else {
            for (let entry of this.dayMemories) {
                if (entry[0] == date && entry[1] == text){  //full same
                    
                    alert("На это время вы уже добавляли запись!")
                    return
                } else if (entry[0].valueOf() == date) {    //data same
    
                    alert("На это время вы уже добавляли запись!")
                    return
                }
            }
    
            this.dayMemories.set(date,`${text}`)
            //addToDb(memory)
            let memoryToDB = {
                dateKey: date,
                contentType: "memory",
                content: text,
                complete: 'false'
            }
            $.ajax({
                type: "PUT",
                url: '/memory',
                headers: {
                    "AUTHORIZATION": `Bearer ${getCookie("accessToken")}`
                },
                data: memoryToDB,
                success: function (err,req,resp) {
                    console.log("Добавление воспоминания",resp)
                },
                error: function (xmlHttpRequest, textStatus, errorThrown) {
                    console.log("Ошибка добавления воспоминания", xmlHttpRequest)
                }
            })

            this.renderMemories()
            
            this.checkRecordsforBlock(new Date(this.selectedBlock.year,this.selectedBlock.month,this.selectedBlock.day),this.dayMemories,"calendar-hasMemory")
        }
        

        this.checkRecordsforMonth()
    }

    deleteNote(e,target = null) {
        let deleteObj = e==null?target:e.currentTarget

        let date = this.secondaryRecords[ $(deleteObj).parents(".note").index() ]
        
        if (this.dayNotes.has(date)){
            this.dayNotes.delete(date)
            this.secondaryRecords.splice( $(deleteObj).parents(".note").index(), 1 )
            //deleteFromDB
            $.ajax({
                type: "DELETE",
                url: '/note',
                headers: {
                    "AUTHORIZATION": `Bearer ${getCookie("accessToken")}`
                },
                data: {
                    recordKey: date
                },
                success: function (err,req,resp) {
                    console.log("Удаление дела",resp)
                }
            })
        }
        
        $(deleteObj).parents(".note").css({"transform":"translateX(100%)","opacity":"0"})
        setTimeout( () => {
            $(deleteObj).parents(".note").remove()
            if (!$("#records-cont").find('.note').length){
                this.getSelectedBlock().removeClass("calendar-hasNote")
                $(`.calendar-otherMonth:nth-of-type(${this.selectedBlock.day - (this.monthModel.prevMonthDays - this.monthModel.primaryDayWeek)})`).removeClass("calendar-hasNote")
                $(`.calendar-otherMonth:nth-of-type(${this.selectedBlock.day + this.monthModel.primaryDayWeek + this.monthModel.daysInMonth})`).removeClass("calendar-hasNote")
                $("#records-cont").append( "<h1 id='secondary-empty' >Вы пока не добавляли дел</h1>" )
            }
            this.checkRecordsforMonth()
        }, 300 )
    }
    deleteMemory(e,target = null) {
        let deleteObj = e==null?target:e.currentTarget

        let date = this.secondaryRecords[ $(deleteObj).parents(".memory").index() ]

        if (this.dayMemories.has(date)){
            this.dayMemories.delete(date)
            this.secondaryRecords.splice( $(deleteObj).parents(".memory").index(), 1 )

            //deleteFromDB
            $.ajax({
                type: "DELETE",
                url: '/memory',
                headers: {
                    "AUTHORIZATION": `Bearer ${getCookie("accessToken")}`
                },
                data: {
                    recordKey: date
                },
                success: function (err,req,resp) {
                    console.log("Удаление воспоминания",resp)
                }
            })
        }
        
        $(deleteObj).parents(".memory").css({"transform":"translateX(100%)","opacity":"0"})
        setTimeout( () => {
            $(deleteObj).parents(".memory").remove()

            if (!$("#records-cont").find('.memory').length){
                this.getSelectedBlock().removeClass("calendar-hasMemory")
                $(`.calendar-otherMonth:nth-of-type(${this.selectedBlock.day - (this.monthModel.prevMonthDays - this.monthModel.primaryDayWeek)})`).removeClass("calendar-hasMemory")
                $(`.calendar-otherMonth:nth-of-type(${this.selectedBlock.day + this.monthModel.primaryDayWeek + this.monthModel.daysInMonth})`).removeClass("calendar-hasMemory")
                $("#records-cont").append( "<h1 id='secondary-empty' >Вы пока не добавляли записей</h1>" )
            }
            
            this.checkRecordsforMonth()
        }, 300 )
    }

    editNote(e) {
        let date = this.secondaryRecords[ $(e.currentTarget).parents(".note").index() ]

        let contentCont = $(e.currentTarget).parents(".note").children(".note-content-cont")
        let content = $(contentCont).children(".note-content").html()

        $(contentCont).children(".note-content").attr("contenteditable","true")
        
        
        let menu = $(e.currentTarget).parents(".note").children(".note-content-cont").children(".note-edit-menu")

        //addEventsToMenuObjects
        $(menu).children(".note-edit-accept").click( () => {
            //updateNote
            if ($(contentCont).children(".note-content").text().trim() != "") {
                $(contentCont).children(".note-content").attr("contenteditable","false")                        //visual
            
                this.dayNotes.set(date,{"content": $(contentCont).children(".note-content").html(), "complete": false})        
                //updateDB
                //...
                $.ajax({
                    type: "PATCH",
                    url: '/note',
                    headers: {
                        "AUTHORIZATION": `Bearer ${getCookie("accessToken")}`
                    },
                    data: {
                        keyDate: date,
                        newContent: $(contentCont).children(".note-content").html(),
                        completed: false
                    },
                    success: function (err,req,resp) {
                        console.log("Изменение дела",resp)
                    },
                    error: function (xmlHttpRequest, textStatus, errorThrown) {
                        console.log("Ошибка при изменении дела", xmlHttpRequest)
                    }
                })

                $(e.currentTarget).parents(".note-info").css("opacity","1") //visual
                $(menu).css({"opacity":"0","transform":"translateX(0)"})    //visual
            } else {
                $(contentCont).children(".note-content").html(content)
            }
        })
        $(menu).children(".note-edit-reset").click( () => {
            //resetContent
            $(contentCont).children(".note-content").html(content)
        })
        
        $(e.currentTarget).parents(".note-info").css("opacity","0")
        $(menu).css({"opacity":"1","transform":"translateX(-125%)"})
        
    }

    editMemory(e) {
        let date = this.secondaryRecords[ $(e.currentTarget).parents(".memory").index() ]
        let contentCont = $(e.currentTarget).parents(".memory").children(".memory-content-cont")
        let content = $(contentCont).children(".memory-content").html()

        $(contentCont).children(".memory-content").attr("contenteditable","true")
        $(contentCont).children(".note-content-background").css("filter","blur(3px) hue-rotate(200deg)")


        let regImgTag = /<img src=".+">/gmi
        let imgTags = content.match(regImgTag)
        
        if (imgTags) {
            imgTags.forEach( el => {
                let url = el.match(/[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gi)
                content = content.replace(/<img src=".+">/mi,`[${url}]`)
            })
        }

        $(contentCont).children(".memory-content").html(content)

        let menu = $(e.currentTarget).parents(".memory").children(".memory-edit-menu")

        //addEventsToMenuObjects
        $(menu).children(".memory-edit-accept").click( (e) => {
            //updateNote
            if ($(contentCont).children(".memory-content").text().trim() != "") {
                $(contentCont).children(".memory-content").attr("contenteditable","false")                        //visual
                $(contentCont).children(".note-content-background").css("filter","blur(3px) hue-rotate(0deg)")  //visual
            

                this.dayMemories.set(date,$(contentCont).children(".memory-content").html())
                this.renderMemories()
                //updateDB
                //...
                $.ajax({
                    type: "PATCH",
                    url: '/memory',
                    headers: {
                        "AUTHORIZATION": `Bearer ${getCookie("accessToken")}`
                    },
                    data: {
                        keyDate: date,
                        newContent: $(contentCont).children(".memory-content").html(),
                        completed: false
                    },
                    success: function (err,req,resp) {
                        console.log("Изменение дела",resp)
                    },
                    error: function (xmlHttpRequest, textStatus, errorThrown) {
                        console.log("Ошибка при изменении дела", xmlHttpRequest)
                    }
                })
                
                
            } else {
                $(contentCont).children(".memory-content").html(content)
            }
        })
        $(menu).children(".memory-edit-reset").click( () => {
            //resetContent
            $(contentCont).children(".memory-content").html(content)
        })
        
        $(e.currentTarget).parents(".memory").children(".memory-menu-cont").css({"transform":"translateX(500%)", "opacity": "0"})
        setTimeout( () => {
            $(menu).css({"opacity":"1","transform":"translateX(0%)"})  
        } , 300)
        
        
    }

    completeNote(e) {
        let note = $(e.currentTarget).parents(".note")

        let date = this.secondaryRecords[ $(note).index() ]
        
        $(note).addClass("info-state-complete")
        console.log(note)


        if (this.dayNotes.has(date)){
            let content = this.dayNotes.get(date).content
            this.dayNotes.set(date,{"content": content,"complete": true})
            //updateDB
            $.ajax({
                type: "PATCH",
                url: '/note',
                headers: {
                    "AUTHORIZATION": `Bearer ${getCookie("accessToken")}`
                },
                data: {
                    keyDate: date,
                    newContent: content,
                    completed: true
                },
                success: function (err,req,resp) {
                    console.log("Выполнение дела",resp)
                },
                error: function (xmlHttpRequest, textStatus, errorThrown) {
                    console.log("Ошибка при выполнении дела", xmlHttpRequest)
                }
            })

            this.renderNotes()
        }
            
    }

    reformText(text) {
        var p = function(s) { return '<div>' + s + '</div>' }

        return text
        .split('\n') // разбиваем значение textarea на массив по двум переносам
        .map(function(item) { return p(item) }) // оборачиваем каждый элемент в тег p
        .join('') // получаем из элементов массива строку
        .replace(/\n/g, '<br>') // заменяем оставшиеся переносы на <br>
    }

}
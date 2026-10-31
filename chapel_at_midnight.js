/* MATCH, Task 2: "The Chapel at Midnight" quest engine.
 *
 * preview.html loads this file before its own script and creates one engine
 * with MATCH_CHAPEL_ENGINE.create(api). The game then calls a few hooks, all
 * marked "Task 2" in preview.html. If this file is missing, every hook is
 * skipped and the game runs as before.
 *
 * All quest state lives in world.chapel, so it is saved, loaded and reset
 * with the rest of the run. Narrative text and tuning numbers live in
 * chapel_at_midnight.json.
 *
 * Core loops (deliberately different from the Blue Ribbon evidence board):
 *  - a countdown in simulated days that careless questions bring forward
 *  - deciphering coded phrases against news and chapel lore
 *  - reading which goths are innocent, sympathetic or dangerous
 *  - per-Sister trust built through respectful talk, favours and promises
 *  - a vigil roster: prayer leader, keys, door watch, voices, place and night
 */
(function(root){
  'use strict';
  const LIGHTING={'bedroom-dusk':'dusk','bedroom-night':'night','bedroom-morning':'morning','bedroom-afternoon':'afternoon'};
  const STAGES=['threshold','charge','lunge'];
  const VICTORIA='MATCH-003',MARGARET='MATCH-055',TERESA='MATCH-056',SOPHIA='MATCH-007',EVELYN='MATCH-057';
  const GOTHS=['MATCH-061','MATCH-062','MATCH-063'];
  const SISTERS=[MARGARET,TERESA,SOPHIA,EVELYN];
  const CHAPELS=['old_mission','cemetery_chapel','st_brigid'];
  const PLACES=[...CHAPELS,'lantern_vault'];
  const ROLES=['innocent','sympathetic','dangerous'];
  const GOTH_ACTS=['show','crescent','help','warn','tell','accuse'];
  const VICTORIA_ACTS=['show','crescent','accept','backout','confront'];
  const SLOTS=['prayer','keys','watch'];
  const FATAL=['confront','marked_twice','ritual_marked','watch_broken','went_alone'];
  const OUTCOMES=['vigil_success','vigil_reconciled','vigil_partial','vigil_failed','wrong_place','too_late','ignored','withdrawn'];
  const SURVIVED_RITE=['vigil_success','vigil_reconciled','vigil_partial'];
  const FRAGMENTS=['show','skywatch','heritage','aftershow','lore','diary','allyPhrase','zaraLie','allyWarning'];
  // Milliseconds from the start of the attack: crescent premonition, then
  // the three room frames, the blackout and finally the death screen.
  const ATTACK={frames:[1500,2450,3400],devour:4000,death:4900};
  const STYLE=`
    .chapel-attack{display:none;position:absolute;z-index:19;inset:0;background:#05040a;overflow:hidden;pointer-events:none}
    .chapel-attack.visible{display:block}
    .chapel-attack img{width:100%;height:100%;object-fit:cover;image-rendering:pixelated}
    .chapel-attack p{position:absolute;left:8%;right:8%;bottom:9%;margin:0;padding:9px;text-align:center;color:#f2dcff;background:#0b0610d9;border:1px solid #8c6aa6;font:bold 13px/1.4 'Trebuchet MS',Tahoma,sans-serif;letter-spacing:.06em}
    .chapel-attack p:empty{display:none}
    .chapel-attack.jolt img{animation:chapelJolt 270ms steps(4,end) both}
    .chapel-attack.devouring img{animation:chapelDevour 600ms steps(4,end) forwards}
    @keyframes chapelJolt{0%,100%{transform:none;filter:brightness(1)}25%{transform:translateX(4px);filter:brightness(1.25)}50%{transform:translateX(-4px);filter:brightness(.6)}75%{transform:translateY(-5px)}}
    @keyframes chapelDevour{0%{transform:scale(1);filter:brightness(1)}45%{transform:scale(1.12);filter:brightness(.6) hue-rotate(-20deg)}85%,100%{transform:scale(1.3);filter:brightness(0)}}
    .hinge-options{max-height:56%;overflow-y:auto}
    .hinge-chat-choice.chapel-choice{color:#4b2d63;background:#f6efff;border-color:#b79bd3}
    .hinge-chat-choice.chapel-choice.risky{color:#8d2c47;background:#fff;border-color:#d9a0b3}
    .hinge-chat-choice.chapel-entry{color:#f5ecff;background:#3b2a52;border-color:#8f74b3}
    .chapel-case h3{margin-top:4px}
    .chapel-case h4{margin:14px 0 5px;font:bold 11px -apple-system,Arial,sans-serif;text-transform:uppercase;letter-spacing:.07em;color:#7b4f9c}
    .chapel-case p,.chapel-case li{font-size:calc(11px * var(--reading-scale));line-height:1.45;margin:4px 0;color:#333b48}
    .chapel-case ul{margin:3px 0;padding-left:15px}
    .chapel-case .chapel-status{padding:7px;border:1px solid #c7b1dc;border-radius:5px;background:#f8f2ff;color:#3b2752}
    .chapel-case .chapel-danger{color:#a3263f;font-weight:bold}
    .chapel-row{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}
    .chapel-btn{cursor:pointer;border:1px solid #a996bd;border-radius:4px;background:#fff;color:#3b2c4c;padding:5px 6px;font:bold calc(10px * var(--reading-scale)) -apple-system,Arial,sans-serif}
    .chapel-btn.on{background:#4b3466;color:#fff;border-color:#4b3466}
    .chapel-btn.warn{color:#a3263f;border-color:#d79aaa}
    .chapel-person{border-top:1px dashed #d8c9e6;padding:5px 0}
    .chapel-person small{display:block;color:#6b6075;font-size:calc(10px * var(--reading-scale))}
    .chapel-dots{letter-spacing:1px;color:#7b4f9c;font-family:ui-monospace,Consolas,monospace}
    .chapel-back{margin-bottom:4px}
    @media (prefers-reduced-motion: reduce){.chapel-attack.jolt img,.chapel-attack.devouring img{animation:none}}
  `;

  function attackFrame(phase,stage){
    return `assets/events/goth-${LIGHTING[phase]||'night'}-${STAGES[stage]}.webp`;
  }
  // Quest randomness is derived from the run seed, so it never disturbs the
  // game's own random sequence and is identical after Save/Load.
  function seeded(text){
    let hash=2166136261;
    for(const char of String(text)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
    let x=(hash>>>0)||1;
    return ()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};
  }

  function create(api){
    let data=root.MATCH_CHAPEL_DATA||null;
    let caseOpen=false,walkAwayArmed=false,attackTimers=[],warnTimer=null;
    let overlay=null,overlayImage=null,overlayCaption=null,fatalBackground=null;
    const questMode=new Set();
    if(!data&&typeof root.fetch==='function'){
      // The linked-asset preview.html loads the JSON; the standalone build inlines it.
      root.fetch('chapel_at_midnight.json').then(response=>response.json()).then(json=>{data=json;}).catch(()=>{});
    }

    // ---------- state ----------
    function freshState(world){
      const rnd=seeded(`${world.seed||'match'}:chapel`);
      const location=CHAPELS[Math.floor(rnd()*CHAPELS.length)];
      const others=CHAPELS.filter(place=>place!==location);
      const decoyPlace=others[Math.floor(rnd()*others.length)];
      const order=[...ROLES];
      for(let i=order.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
      const [low,high]=data.rules.ritualSpanDays;
      return {
        v:1,active:false,activatedDay:null,location,decoyPlace,chalkTrueFirst:rnd()<.5,
        roles:Object.fromEntries(GOTHS.map((id,i)=>[id,order[i]])),
        span:low+Math.floor(rnd()*(high-low+1)),
        ritualDay:null,originalRitualDay:null,showDay:null,
        alerts:0,marks:0,warnedMarks:0,warningPending:false,
        attackDueDay:null,attackReason:null,attackPending:false,attackRunning:false,attackPhase:null,dead:false,death:null,
        wentAlone:false,withdrawn:false,introduced:false,
        fragments:{},reading:{where:null,when:null},reads:{},
        goths:Object.fromEntries(GOTHS.map(id=>[id,{asked:[],closed:false,ally:false,warned:false,accused:false,told:false}])),
        victoria:{asked:[]},
        sisters:Object.fromEntries(SISTERS.map(id=>[id,{trust:data.sisters[id].startTrust,done:[],revealed:[],recruited:false,promise:false,promiseBroken:false,favour:null,lost:false}])),
        allyJoins:false,pendingAllyWarning:false,queue:[],
        draft:{place:null,nights:1,prayer:null,keys:null,watch:null},
        vigil:null,lastVigil:null,vigilsHeld:0,refuseVigils:false,vigilError:null,
        outcome:null,outcomeDay:null,ritualCompleted:false,resultText:null,notice:null,journal:[]
      };
    }
    function state(){
      if(!data)return null;
      const world=api.world();
      if(!world)return null;
      if(!world.chapel||world.chapel.v!==1)world.chapel=freshState(world);
      return world.chapel;
    }
    // Saved games are untrusted input: keep only known keys of the right type.
    function normalize(raw,world){
      const base=freshState(world);
      if(!raw||typeof raw!=='object'||raw.v!==1)return base;
      const out={...base};
      const int=value=>Number.isInteger(value)?value:null;
      for(const key of ['active','dead','wentAlone','withdrawn','introduced','allyJoins','pendingAllyWarning','attackPending','attackRunning','warningPending','refuseVigils','ritualCompleted','chalkTrueFirst'])out[key]=!!raw[key];
      for(const key of ['activatedDay','ritualDay','originalRitualDay','showDay','attackDueDay','outcomeDay'])out[key]=int(raw[key]);
      for(const key of ['alerts','marks','warnedMarks','vigilsHeld'])out[key]=Math.max(0,int(raw[key])||0);
      if(Number.isInteger(raw.span))out.span=raw.span;
      if(CHAPELS.includes(raw.location))out.location=raw.location;
      out.decoyPlace=CHAPELS.includes(raw.decoyPlace)&&raw.decoyPlace!==out.location?raw.decoyPlace:CHAPELS.find(place=>place!==out.location);
      if(raw.roles&&GOTHS.every(id=>ROLES.includes(raw.roles[id]))&&new Set(GOTHS.map(id=>raw.roles[id])).size===3)out.roles={...raw.roles};
      out.attackReason=FATAL.includes(raw.attackReason)?raw.attackReason:null;
      out.death=FATAL.includes(raw.death)?raw.death:null;
      out.attackPhase=LIGHTING[raw.attackPhase]?raw.attackPhase:null;
      out.outcome=OUTCOMES.includes(raw.outcome)?raw.outcome:null;
      out.resultText=typeof raw.resultText==='string'?raw.resultText.slice(0,500):null;
      out.fragments={};
      for(const key of FRAGMENTS){
        const item=raw.fragments?.[key];
        if(!item||!Number.isInteger(item.day))continue;
        out.fragments[key]={day:item.day};
        for(const extra of ['moonlessDay','ritualDay'])if(Number.isInteger(item[extra]))out.fragments[key][extra]=item[extra];
        if(GOTHS.includes(item.source)||SISTERS.includes(item.source))out.fragments[key].source=item.source;
      }
      const when=raw.reading?.when;
      out.reading={where:PLACES.includes(raw.reading?.where)?raw.reading.where:null,
        when:when&&['show','moonless','ally'].includes(when.source)&&Number.isInteger(when.day)?{source:when.source,day:when.day}:null};
      out.reads={};
      for(const id of GOTHS)if(ROLES.includes(raw.reads?.[id]))out.reads[id]=raw.reads[id];
      for(const id of GOTHS){
        const g=raw.goths?.[id]||{};
        out.goths[id]={asked:Array.isArray(g.asked)?g.asked.filter(act=>GOTH_ACTS.includes(act)):[],
          closed:!!g.closed,ally:!!g.ally,warned:!!g.warned,accused:!!g.accused,told:!!g.told};
      }
      out.victoria={asked:Array.isArray(raw.victoria?.asked)?raw.victoria.asked.filter(act=>VICTORIA_ACTS.includes(act)):[]};
      for(const id of SISTERS){
        const s=raw.sisters?.[id]||{};
        const favour=s.favour&&Number.isInteger(s.favour.due)&&['offered','done','broken'].includes(s.favour.state)?{due:s.favour.due,state:s.favour.state}:null;
        out.sisters[id]={trust:Number.isInteger(s.trust)?Math.max(0,Math.min(data.rules.trustMax,s.trust)):base.sisters[id].trust,
          done:Array.isArray(s.done)?s.done.filter(x=>typeof x==='string'):[],
          revealed:Array.isArray(s.revealed)?s.revealed.filter(x=>typeof x==='string'):[],
          recruited:!!s.recruited,promise:!!s.promise,promiseBroken:!!s.promiseBroken,lost:!!s.lost,favour};
      }
      out.queue=Array.isArray(raw.queue)?raw.queue.filter(m=>m&&Number.isInteger(m.day)&&(SISTERS.includes(m.id)||GOTHS.includes(m.id)||m.id===VICTORIA)&&typeof m.text==='string').slice(0,20):[];
      const draft=raw.draft||{};
      out.draft={place:PLACES.includes(draft.place)?draft.place:null,nights:Number.isInteger(draft.nights)?Math.max(1,Math.min(9,draft.nights)):1};
      for(const slot of SLOTS)out.draft[slot]=SISTERS.includes(draft[slot])?draft[slot]:null;
      const vigil=value=>value&&PLACES.includes(value.place)&&Number.isInteger(value.day)?
        {place:value.place,day:value.day,setOn:int(value.setOn),...Object.fromEntries(SLOTS.map(slot=>[slot,SISTERS.includes(value[slot])?value[slot]:null]))}:null;
      out.vigil=vigil(raw.vigil);out.lastVigil=vigil(raw.lastVigil);
      out.journal=Array.isArray(raw.journal)?raw.journal.filter(j=>j&&Number.isInteger(j.day)&&typeof j.text==='string').slice(-40):[];
      return out;
    }

    // ---------- helpers ----------
    const rules=()=>data.rules;
    const today=()=>api.world().day;
    const nameOf=id=>api.profile(id)?.name||'someone';
    const firstName=id=>nameOf(id).split(' ')[0];
    const esc=value=>api.esc(value);
    const placeName=key=>data.places[key]?.name||'an unknown place';
    const placeShort=key=>data.places[key]?.short||'unknown';
    const holder=(st,role)=>GOTHS.find(id=>st.roles[id]===role);
    const threadOf=id=>api.threads().get(id)||null;
    const isClosed=id=>{const thread=threadOf(id);return !!(thread&&(thread.blocked||thread.fumbled));};
    const cap=text=>text.charAt(0).toUpperCase()+text.slice(1);
    function relDays(target){
      const n=target-today();
      if(n<=0)return 'already past';
      if(n===1)return 'tomorrow';
      return `in ${n} days`;
    }
    function fill(text,extra={}){
      const st=state();
      const chalk=st.chalkTrueFirst?[st.location,st.decoyPlace]:[st.decoyPlace,st.location];
      const vars={phrase:data.places[st.location].phrase,place:placeName(st.location),Place:cap(placeName(st.location)),
        PLACE:placeName(st.location).toUpperCase(),decoyPlace:placeName(st.decoyPlace),
        chalkA:placeName(chalk[0]),chalkB:placeName(chalk[1]),
        innocent:nameOf(holder(st,'innocent')),sympathetic:nameOf(holder(st,'sympathetic')),dangerous:nameOf(holder(st,'dangerous')),
        vigilPlace:placeName(st.lastVigil?.place),...extra};
      return String(text).replace(/\{(\w+)\}/g,(match,key)=>vars[key]!==undefined?String(vars[key]):match);
    }
    function journal(st,text){
      st.journal.push({day:today(),text});
      if(st.journal.length>40)st.journal.splice(0,st.journal.length-40);
    }
    function clue(st,text){api.recordClue(text);journal(st,text);}
    function addFragment(st,key,extra={},replace=false){
      if(st.fragments[key]&&!replace)return false;
      st.fragments[key]={day:today(),...extra};
      return true;
    }
    function deliver(id,text){
      const thread=threadOf(id);
      if(!thread||thread.blocked||thread.fumbled)return false;
      thread.awaiting=false;thread.ghosted=false;thread.replyOnDay=null;
      thread.log.push({who:'her',text});
      return true;
    }
    function queueMessage(st,id,text){st.queue.push({day:today()+1,id,text});}
    function refresh(){if(caseOpen)renderCase();else api.rerender();}
    // Shows the player's line, a typing bubble, then her reply.
    function converse(id,playerText,replyText,after){
      const thread=threadOf(id),profile=api.profile(id);
      if(!thread||!profile||thread.pending)return false;
      const seed=api.world().seed;
      thread.log.push({who:'you',text:playerText});
      thread.pending=true;
      questMode.add(id);
      refresh();
      api.later(()=>{
        thread.pending=false;
        if(api.world().seed!==seed)return; // a new run started meanwhile
        if(replyText)thread.log.push({who:'her',text:replyText});
        const st=state();
        if(st&&after)after(st,thread);
        refresh();
      },api.replyDelay(profile,'chapel'));
      return true;
    }

    // ---------- trust, roster, coven attention ----------
    function threshold(st){return st.sisters[MARGARET].recruited?rules().persuadedThreshold:rules().trustThreshold;}
    function joinBar(st,id){return id===MARGARET?rules().trustThreshold:threshold(st);}
    function revalidate(st){
      for(let pass=0;pass<2;pass++){
        for(const id of SISTERS){
          const s=st.sisters[id];
          if(isClosed(id)){
            if(!s.lost){s.lost=true;if(s.recruited)journal(st,`${nameOf(id)} closed the conversation and left the vigil.`);}
            s.recruited=false;continue;
          }
          if(s.recruited&&s.trust<joinBar(st,id)){s.recruited=false;journal(st,`${nameOf(id)} no longer trusts you enough to stand at the vigil.`);}
        }
      }
      for(const slot of SLOTS)if(st.draft[slot]&&!st.sisters[st.draft[slot]]?.recruited)st.draft[slot]=null;
    }
    function changeTrust(st,id,delta){
      const s=st.sisters[id];
      if(!s||s.lost||!delta)return;
      s.trust=Math.max(0,Math.min(rules().trustMax,s.trust+delta));
      revalidate(st);
    }
    function allyId(st){
      const id=GOTHS.find(goth=>st.goths[goth].ally);
      return id&&!isClosed(id)?id:null;
    }
    // Careless questions reach Victoria and bring the rite forward.
    function alertCoven(st,shift,why){
      st.alerts++;
      const before=st.ritualDay;
      st.ritualDay=Math.max(today()+1,st.ritualDay-shift);
      journal(st,why);
      if(st.ritualDay!==before&&allyId(st))st.pendingAllyWarning=true;
    }
    // One mark brings a warning; a second brings Victoria.
    function addMark(st,why){
      st.marks++;
      journal(st,why);
      if(st.marks>=2&&st.attackDueDay===null){st.attackDueDay=today()+1;st.attackReason='marked_twice';}
    }
    function breakEvelynPromise(st){
      const evelyn=st.sisters[EVELYN];
      if(!evelyn.promise||evelyn.promiseBroken)return;
      evelyn.promiseBroken=true;
      changeTrust(st,EVELYN,-4);
      queueMessage(st,EVELYN,data.sisters[EVELYN].promiseBroken);
      journal(st,'You broke your promise to Evelyn Rosales.');
    }
    const canTell=st=>SISTERS.some(id=>st.sisters[id].recruited)||!!st.vigil;

    // ---------- activation ----------
    function activate(st){
      st.active=true;
      st.activatedDay=today();
      st.showDay=st.activatedDay+rules().showOffsetDays;
      st.originalRitualDay=st.activatedDay+st.span;
      st.ritualDay=st.originalRitualDay;
      const victoria=api.profile(VICTORIA);
      if(victoria&&!isClosed(VICTORIA)){
        let thread=threadOf(VICTORIA);
        if(!thread){thread=api.ensureThread(victoria);thread.log=[];}
        deliver(VICTORIA,data.victoria.opening);
      }
      ensureServiceTopic(true);
      const edition=(api.world().editions||[]).find(item=>item.day===today());
      if(edition)decorateEdition(edition);
      journal(st,'Case opened. Victoria Blackwood messaged you about her Midnight Show.');
      st.notice='☾ Victoria Blackwood messaged you. A new case file is in your bedside cupboard.';
    }
    function ensureServiceTopic(on){
      const list=api.serviceTopics?.['service:chapel'];
      if(!list||!data)return;
      const index=list.findIndex(topic=>topic.id==='chapel_crescent');
      if(on&&index<0)list.push({id:'chapel_crescent',label:data.chapelCall.label,flag:'chapelCrescentCall',reply:data.chapelCall.reply,clue:data.chapelCall.clue,onChoose:()=>{sync();}});
      if(!on&&index>=0)list.splice(index,1);
    }
    function syncIntro(st){
      if(!st.active||st.introduced||!api.world().flags?.chapelCrescentCall)return;
      st.introduced=true;
      for(const id of SISTERS){
        const profile=api.profile(id);
        if(!profile||isClosed(id))continue;
        let thread=threadOf(id);
        if(!thread){thread=api.ensureThread(profile);thread.log=[];}
        deliver(id,fill(data.sisters[id].intro));
      }
      journal(st,'Margaret Holloway introduced you to the Sisters of Mercy. Their chats are in Hinge.');
    }
    function syncNews(st){
      const world=api.world(),seen=world.seenArticles||[];
      for(const edition of world.editions||[]){
        for(const item of edition.items||[]){
          if(!item.chapelFragment||!seen.includes(`${edition.day}:${item.id}`))continue;
          if(addFragment(st,item.chapelFragment,{...(item.chapelData||{}),day:edition.day}))journal(st,`News, day ${edition.day}: ${item.clue||item.title}`);
        }
      }
    }
    function sync(){
      const st=state();
      if(!st)return null;
      syncNews(st);syncIntro(st);revalidate(st);
      return st;
    }

    // ---------- goths ----------
    function gothAvailable(st,id){
      const g=st.goths[id];
      return GOTH_ACTS.filter(act=>{
        if(act==='accuse')return true;
        if(g.asked.includes(act))return false;
        if(act==='help'&&g.ally)return false;
        if(act==='tell'&&!canTell(st))return false;
        return true;
      });
    }
    function gothAct(st,id,act){
      const g=st.goths[id],role=st.roles[id];
      if(!g||g.closed||isClosed(id)||st.outcome||st.withdrawn||!gothAvailable(st,id).includes(act))return;
      g.asked.push(act);
      converse(id,data.gothActions[act].player,fill(data.gothRoles[role][act]),(st)=>gothEffect(st,id,role,act));
    }
    function gothEffect(st,id,role,act){
      const g=st.goths[id],name=nameOf(id);
      if(act==='show'&&role==='dangerous')addFragment(st,'zaraLie',{source:id});
      if(act==='crescent'){
        if(role==='innocent'&&addFragment(st,'diary',{source:id}))clue(st,`${name} mentioned a line in Victoria's booking diary: "${data.diaryPhrase}"`);
        if(role==='dangerous')alertCoven(st,1,`${name} reacted badly to your question about the crescent. Word will reach Victoria.`);
      }
      if(act==='help'){
        if(role==='sympathetic'){
          g.ally=true;
          addFragment(st,'allyPhrase',{source:id});
          if(addFragment(st,'diary',{source:id}))clue(st,`${name} says the rite is "${data.places[st.location].phrase}", "when the moon closes her eye".`);
          journal(st,`${name} wants out and promised to warn you if the plan changes.`);
        }
        if(role==='dangerous'){alertCoven(st,2,`${name} is passing your question straight to Victoria.`);addMark(st,`${name} knows you want to stop the rite.`);}
      }
      if(act==='warn'){
        if(role==='dangerous')alertCoven(st,1,`${name} told Victoria that someone is warning people off.`);
        else{g.warned=true;journal(st,`You warned ${name} to skip the after-party.`);}
      }
      if(act==='tell'){
        g.told=true;
        breakEvelynPromise(st);
        if(role==='sympathetic'){st.allyJoins=true;journal(st,`${name} will stand with the Sisters at the vigil.`);}
        if(role==='innocent')alertCoven(st,1,`${name} joked about the Sisters' vigil in a group chat. Victoria will have seen it.`);
        if(role==='dangerous'){alertCoven(st,2,`${name} now knows about the vigil.`);addMark(st,`${name} knows the Sisters are coming, and who sent them.`);}
      }
      if(act==='accuse'){
        g.closed=true;g.accused=true;
        const thread=threadOf(id);
        if(thread)thread.fumbled=true;
        if(role==='innocent'){
          alertCoven(st,1,`${name} is telling everyone you accused her. Victoria will hear.`);
          changeTrust(st,TERESA,-3);
          queueMessage(st,TERESA,fill(data.sisters[TERESA].accusedFriend));
        }
        if(role==='sympathetic'){g.ally=false;st.allyJoins=false;alertCoven(st,1,`${name} panicked and told Victoria that someone knows.`);}
        if(role==='dangerous'){alertCoven(st,2,`${name} went straight to Victoria.`);addMark(st,`${name} has marked you as a threat.`);}
      }
    }
    function victoriaAvailable(st){
      const asked=st.victoria.asked,out=[];
      if(!asked.includes('show'))out.push('show');
      if(!asked.includes('crescent'))out.push('crescent');
      if(!st.wentAlone&&!asked.includes('accept'))out.push('accept');
      if(st.wentAlone)out.push('backout');
      out.push('confront');
      return out;
    }
    function victoriaAct(st,act){
      if(isClosed(VICTORIA)||st.outcome||!victoriaAvailable(st).includes(act))return;
      const line=data.victoria.actions[act];
      st.victoria.asked.push(act);
      converse(VICTORIA,line.player,line.reply,(st,thread)=>{
        if(act==='crescent'){addMark(st,'Victoria noticed your interest in the crescent.');alertCoven(st,1,'Victoria is bringing her plans forward.');}
        if(act==='accept'){st.wentAlone=true;journal(st,'You told Victoria you would come to the after-party alone.');}
        if(act==='backout'){st.wentAlone=false;addMark(st,'You backed out of Victoria\'s invitation. She will remember you.');}
        if(act==='confront'){
          thread.fumbled=true;
          if(st.attackDueDay===null){st.attackDueDay=today()+1;st.attackReason='confront';}
          journal(st,'You told Victoria you knew what she was planning.');
        }
      });
    }

    // ---------- Sisters ----------
    function topicOpen(st,id,topic){
      const s=st.sisters[id];
      if(s.done.includes(topic.id))return false;
      if(topic.group&&data.sisters[id].topics.some(other=>other.group===topic.group&&s.done.includes(other.id)))return false;
      return true;
    }
    function sisterAct(st,id,key){
      const s=st.sisters[id],def=data.sisters[id];
      if(!s||!def||s.lost||isClosed(id)||st.outcome||st.withdrawn)return;
      if(key==='favour-offer')return favourOffer(st,id);
      if(key==='favour-do')return favourDo(st,id);
      if(key==='recruit')return recruit(st,id);
      const topic=def.topics.find(item=>item.id===key);
      if(!topic||!topicOpen(st,id,topic))return;
      let reply=topic.reply,delta=topic.trust||0;
      if(topic.effect==='evidence'){
        const known=(st.reading.where?1:0)+(st.reading.when?1:0);
        const result=topic.results[known===2?'full':known===1?'half':'none'];
        reply=result.reply;delta=result.trust;
        if(known===2)s.done.push(topic.id);
        else if(s.done.includes('evidence_tried'))delta=Math.max(0,delta);
        if(!s.done.includes('evidence_tried'))s.done.push('evidence_tried');
      }else s.done.push(topic.id);
      for(const revealed of topic.reveals||[])if(!s.revealed.includes(revealed))s.revealed.push(revealed);
      converse(id,topic.player,fill(reply),(st)=>{
        changeTrust(st,id,delta);
        if(topic.effect==='lore'&&addFragment(st,'lore',{source:id}))journal(st,`${nameOf(id)} explained which chapel has the cracked bell, the angels and the cloak.`);
        if(topic.effect==='promise'){st.sisters[id].promise=true;journal(st,'You promised Evelyn not to tell the goth crowd about the Sisters.');}
      });
    }
    function favourOffer(st,id){
      const s=st.sisters[id],favour=data.sisters[id].favour;
      if(!favour||s.favour)return;
      s.favour={due:today()+1,state:'offered'};
      converse(id,favour.offerPlayer,favour.offerReply,(st)=>journal(st,`You promised ${nameOf(id)} your help tomorrow.`));
    }
    function favourDo(st,id){
      const s=st.sisters[id],favour=data.sisters[id].favour;
      if(!favour||s.favour?.state!=='offered'||today()!==s.favour.due)return;
      s.favour.state='done';
      converse(id,favour.doPlayer,favour.doReply,(st)=>{changeTrust(st,id,favour.trust);journal(st,`You kept your word to ${nameOf(id)}.`);});
    }
    function expireFavours(st){
      for(const id of SISTERS){
        const s=st.sisters[id],favour=data.sisters[id].favour;
        if(!favour||s.favour?.state!=='offered'||today()<=s.favour.due)continue;
        s.favour.state='broken';
        deliver(id,favour.brokenReply);
        changeTrust(st,id,favour.brokenTrust);
        journal(st,`You broke your promise to ${nameOf(id)}.`);
      }
    }
    function recruit(st,id){
      const s=st.sisters[id],lines=data.sisters[id].recruit;
      if(s.recruited)return;
      if(st.refuseVigils){converse(id,lines.player,data.messages.refuseVigils);return;}
      const accepted=s.trust>=joinBar(st,id);
      converse(id,lines.player,accepted?lines.yes:lines.no,(st)=>{
        const sister=st.sisters[id];
        if(accepted){sister.recruited=true;journal(st,`${nameOf(id)} will stand at the vigil.`);revalidate(st);}
        else if(sister.trust<threshold(st)-2)changeTrust(st,id,-1);
      });
    }

    // ---------- deciphering ----------
    function whenOptions(st){
      const options=[];
      if(st.fragments.show)options.push({key:'show',day:st.showDay,label:'The night of the Midnight Show'});
      if(st.fragments.skywatch)options.push({key:'moonless',day:st.fragments.skywatch.moonlessDay??st.originalRitualDay,label:'The moonless night'});
      if(st.fragments.allyWarning)options.push({key:'ally',day:st.fragments.allyWarning.ritualDay,label:`${firstName(st.fragments.allyWarning.source||allyId(st)||GOTHS[0])}'s warning`});
      return options;
    }
    function setWhere(st,place){
      if(!PLACES.includes(place))return;
      st.reading.where=place;
      if(!st.vigil)st.draft.place=place;
    }
    function setWhen(st,key){
      const option=whenOptions(st).find(item=>item.key===key);
      if(!option)return;
      st.reading.when={source:key,day:option.day};
      if(!st.vigil)st.draft.nights=Math.max(1,Math.min(9,option.day-today()));
    }

    // ---------- vigil ----------
    const recruitedSisters=st=>SISTERS.filter(id=>st.sisters[id].recruited&&!isClosed(id));
    function allyStands(st){const id=holder(st,'sympathetic');return st.allyJoins&&!!id&&!isClosed(id)&&!st.goths[id].closed;}
    function voices(st){
      const recruited=recruitedSisters(st);
      return recruited.length+recruited.reduce((sum,id)=>sum+(data.sisters[id].abilities.extraVoices||0),0)+(allyStands(st)?1:0);
    }
    function assignSlot(st,slot,id){
      if(!SLOTS.includes(slot)||st.vigil)return;
      if(id==='none'){st.draft[slot]=null;return;}
      if(!st.sisters[id]?.recruited)return;
      for(const other of SLOTS)if(st.draft[other]===id)st.draft[other]=null;
      st.draft[slot]=id;
    }
    function sendVigil(st){
      st.vigilError=null;
      if(st.refuseVigils||st.outcome||st.withdrawn)return;
      if(!recruitedSisters(st).length){st.vigilError='Recruit at least one Sister first.';return;}
      if(!st.draft.place){st.vigilError='Choose a chapel first.';return;}
      st.vigil={place:st.draft.place,day:today()+st.draft.nights,setOn:today(),prayer:st.draft.prayer,keys:st.draft.keys,watch:st.draft.watch};
      journal(st,`You sent word: a vigil at ${placeName(st.vigil.place)}, ${relDays(st.vigil.day)}.`);
    }
    function earlyVigil(st){
      const place=st.vigil.place;
      st.lastVigil=st.vigil;st.vigil=null;st.vigilsHeld++;
      for(const id of recruitedSisters(st)){deliver(id,data.messages.earlyVigil);changeTrust(st,id,-rules().earlyVigilTrustLoss);}
      journal(st,`The vigil at ${placeName(place)} was held on a quiet night. Nothing came, and the Sisters lost faith.`);
      if(st.vigilsHeld>=rules().maxVigils){st.refuseVigils=true;journal(st,data.messages.refuseVigils);}
    }
    function evaluateVigil(st,vigil){
      const present=id=>!!id&&st.sisters[id]?.recruited&&!isClosed(id);
      const can=id=>data.sisters[id].abilities;
      if(!present(vigil.watch)||!can(vigil.watch).watch)return {outcome:'vigil_failed',fatal:'watch_broken'};
      const prayer=present(vigil.prayer)?can(vigil.prayer).prayer:'none';
      const prayerOk=prayer==='full'||(prayer==='partial'&&st.alerts===0);
      const keysOk=present(vigil.keys)&&can(vigil.keys).keys;
      if(!prayerOk||!keysOk)return {outcome:'vigil_failed',fatal:null};
      const needed=st.alerts>0?rules().voicesNeededAlerted:rules().voicesNeeded,have=voices(st);
      if(have>=needed)return {outcome:allyStands(st)?'vigil_reconciled':'vigil_success',fatal:null};
      if(have===needed-1)return {outcome:'vigil_partial',fatal:null};
      return {outcome:'vigil_failed',fatal:null};
    }
    function resolveRitual(st){
      const vigil=st.vigil&&st.vigil.day===st.ritualDay?st.vigil:null;
      let outcome,fatal=null;
      if(vigil){
        if(vigil.place!==st.location)outcome='wrong_place';
        else ({outcome,fatal}=evaluateVigil(st,vigil));
      }else if(st.withdrawn)outcome='withdrawn';
      else if(st.vigil&&st.vigil.day>st.ritualDay)outcome='too_late';
      else outcome='ignored';
      const completed=!SURVIVED_RITE.includes(outcome);
      if(!fatal&&st.wentAlone)fatal='went_alone';
      if(!fatal&&completed&&st.marks>0)fatal='ritual_marked';
      if(st.vigil)st.lastVigil=st.vigil;
      st.vigil=null;
      st.outcome=outcome;st.outcomeDay=today();st.ritualCompleted=completed;
      st.resultText=fill(data.outcomes[outcome]);
      clue(st,st.resultText);
      for(const id of SISTERS){
        if(st.sisters[id].lost||!threadOf(id))continue;
        if(st.sisters[id].recruited||st.lastVigil)deliver(id,data.sisters[id].after[completed?'failure':'success']);
      }
      const ally=allyId(st);
      if(ally&&!completed)deliver(ally,data.messages.allyAfterSuccess);
      const innocent=holder(st,'innocent');
      if(completed&&innocent&&!st.goths[innocent].warned){
        const thread=threadOf(innocent);
        if(thread){thread.ghosted=true;thread.awaiting=true;}
        journal(st,fill(data.messages.innocentMissing));
      }
      if(fatal&&st.attackDueDay===null){st.attackDueDay=today();st.attackReason=fatal;}
      st.notice=completed?'☾ Something happened in the night. Read today\'s paper.':'✝ The vigil held. Read today\'s paper.';
    }

    // ---------- day hooks ----------
    function deliverQueue(st){
      const keep=[];
      // A message waits until she has a chat with you; a closed chat drops it.
      for(const message of st.queue){
        if(message.day>today()||(!threadOf(message.id)&&!isClosed(message.id)))keep.push(message);
        else deliver(message.id,message.text);
      }
      st.queue=keep;
    }
    function deliverAllyWarning(st){
      st.pendingAllyWarning=false;
      const id=allyId(st);
      if(!id)return;
      const n=st.ritualDay-today();
      deliver(id,n<=1?data.allyWarningTomorrow:fill(data.allyWarning,{n}));
      addFragment(st,'allyWarning',{ritualDay:st.ritualDay,source:id},true);
      clue(st,`${nameOf(id)} warned you that the rite has been moved: it is now ${relDays(st.ritualDay)}.`);
    }
    // Called once per "Start another day", after world.day has advanced and
    // before the new newspaper is printed.
    function onNewDay(){
      const st=state();
      if(!st||st.dead)return;
      if(!st.active){if(today()>=rules().activationDay)activate(st);return;}
      sync();
      deliverQueue(st);
      expireFavours(st);
      if(st.pendingAllyWarning)deliverAllyWarning(st);
      if(!st.outcome){
        if(st.vigil&&st.vigil.day<=today()&&st.vigil.day<st.ritualDay)earlyVigil(st);
        if(today()>=st.ritualDay)resolveRitual(st);
      }
      if(!st.attackPending&&st.attackDueDay!==null&&today()>=st.attackDueDay)st.attackPending=true;
      if(!st.attackPending&&st.marks>st.warnedMarks){st.warningPending=true;st.warnedMarks=st.marks;}
    }
    // Called after the day transition finishes. Returns true when Victoria's
    // attack has taken over the room.
    function afterDayStart(){
      const st=state();
      if(!st)return false;
      if(st.notice){api.status(st.notice);st.notice=null;}
      if(st.attackPending&&!st.dead){startAttack(st.attackReason);return true;}
      if(st.warningPending){st.warningPending=false;showWarning(st);}
      return false;
    }

    // ---------- news ----------
    function story(template,fragment,extra={},chapelData=null){
      const item={id:template.id,section:template.section,title:fill(template.title,extra),summary:fill(template.summary,extra),body:fill(template.body,extra),questStory:true};
      if(template.clue)item.clue=fill(template.clue,extra);
      if(fragment)item.chapelFragment=fragment;
      if(chapelData)item.chapelData=chapelData;
      return item;
    }
    function outcomeVars(st){
      const innocent=holder(st,'innocent');
      const missing=innocent&&!st.goths[innocent].warned?data.news.outcomes.missingInnocent:data.news.outcomes.missingStranger;
      return {vigilNote:st.outcome==='wrong_place'?fill(data.news.outcomes.vigilElsewhere):'',missingBody:fill(missing)};
    }
    function storyFor(st,day){
      if(!st.active)return null;
      if(st.outcome&&day>=st.outcomeDay){
        const key={vigil_success:'success',vigil_reconciled:'reconciled',vigil_partial:'partial'}[st.outcome]||'completed';
        const template=data.news.outcomes[key][day-st.outcomeDay];
        return template?story(template,null,outcomeVars(st)):null;
      }
      const offset=day-st.activatedDay;
      if(offset===0)return story(data.news.show,'show');
      if(offset===1){const n=st.originalRitualDay-day;return story(data.news.skywatch,'skywatch',{n,day},{moonlessDay:st.originalRitualDay});}
      if(offset===2)return story(data.news.heritage,'heritage');
      if(offset===3)return story(data.news.aftershow,'aftershow');
      return null;
    }
    // The quest story takes the third (local filler) tile unless another quest
    // already uses it, in which case it is added as a fourth tile.
    function decorateEdition(edition){
      const st=state();
      if(!st||!edition||!Array.isArray(edition.items))return edition;
      if(edition.items.some(item=>item.questStory&&(item.chapelFragment||item.chapelOutcome)))return edition;
      const item=storyFor(st,edition.day);
      if(!item)return edition;
      if(!item.chapelFragment)item.chapelOutcome=true;
      if(edition.items.length>2&&!edition.items[2].questStory)edition.items[2]=item;
      else edition.items.push(item);
      return edition;
    }

    // ---------- Victoria's attack ----------
    function mount(){
      const doc=api.document;
      if(!doc)return;
      if(!doc.getElementById('chapel-style')&&doc.createElement){
        const style=doc.createElement('style');
        style.id='chapel-style';style.textContent=STYLE;
        (doc.head||doc.body).appendChild(style);
      }
      if(overlay)return;
      overlay=doc.getElementById('chapel-attack');
      if(!overlay&&doc.createElement){
        overlay=doc.createElement('div');
        overlay.id='chapel-attack';overlay.className='chapel-attack';
        overlay.setAttribute('role','img');overlay.setAttribute('aria-label','Victoria Blackwood crosses the bedroom');
        overlay.innerHTML='<img id="chapel-attack-image" alt=""><p id="chapel-attack-caption"></p>';
        api.$('stage').appendChild(overlay);
      }
      overlayImage=doc.getElementById('chapel-attack-image');
      overlayCaption=doc.getElementById('chapel-attack-caption');
    }
    function clearTimers(){
      for(const id of attackTimers)api.cancel(id);
      attackTimers=[];
      if(warnTimer!==null){api.cancel(warnTimer);warnTimer=null;}
    }
    function hideOverlay(){overlay?.classList.remove('visible','jolt','devouring');}
    function showWarning(st){
      mount();
      deliver(VICTORIA,data.victoria.warning);
      clue(st,data.messages.markWarningClue);
      api.setDoor(true);
      overlayImage.src=api.assetUrl(data.death.warningImage);
      overlayCaption.textContent=data.death.warningCaption;
      overlay.classList.add('visible');
      api.playUiSound(150);api.vibrate([200,80,200]);
      warnTimer=api.later(()=>{warnTimer=null;if(!state()?.attackRunning)hideOverlay();},2600);
    }
    // Always fatal: premonition, threshold, charge, lunge, blackout, death.
    function startAttack(reason){
      const st=state();
      if(!st||st.dead)return;
      clearTimers();mount();
      st.attackPending=false;st.attackRunning=true;
      st.attackReason=FATAL.includes(reason)?reason:(st.attackReason||'confront');
      const phase=LIGHTING[api.timePhase()]?api.timePhase():'bedroom-night';
      st.attackPhase=phase;
      caseOpen=false;
      api.setLowered(true);api.setDoor(true);
      overlay.classList.remove('jolt','devouring');
      overlay.classList.add('visible');
      overlayImage.src=api.assetUrl(data.death.warningImage);
      overlayCaption.textContent=data.death.warningCaption;
      api.playUiSound(120);
      STAGES.forEach((stage,index)=>{
        attackTimers.push(api.later(()=>{
          if(!state()?.attackRunning)return;
          overlayCaption.textContent='';
          overlayImage.src=api.assetUrl(attackFrame(phase,index));
          overlay.classList.remove('jolt');void overlay.offsetWidth;overlay.classList.add('jolt');
          api.playUiSound(190+index*120);api.vibrate([150+index*60,80,200]);
        },ATTACK.frames[index]));
      });
      attackTimers.push(api.later(()=>{
        if(!state()?.attackRunning)return;
        overlay.classList.remove('jolt');overlay.classList.add('devouring');api.playUiSound(70);
      },ATTACK.devour));
      attackTimers.push(api.later(()=>{const st=state();if(st?.attackRunning)showDeath(deathKind(st));},ATTACK.death));
    }
    // 'chapel-ritual': the goths' rite succeeded (the player failed to stop it).
    // 'chapel-victoria': Victoria came for the player before or despite the rite.
    function deathKind(st){return st.ritualCompleted?'chapel-ritual':'chapel-victoria';}
    // THE ONE DEATH HOOK for every fatal Chapel outcome. It uses the game's
    // death screen: the red fatal overlay, its pixel "YOU WERE … BY …" title
    // and the death-shadow backdrop. To give Chapel deaths their own screen
    // later, pass a function as api.showDeath in preview.html; it receives the
    // kind above and is used instead (return false to fall back to this one).
    function showDeath(kind){
      const st=state();
      if(!st)return;
      clearTimers();
      st.attackRunning=false;st.dead=true;st.death=st.attackReason||'confront';st.deathKind=kind;
      hideOverlay();
      const text=fill(data.death.reasons[st.death]);
      if(typeof api.showDeath==='function'&&api.showDeath(kind,{reason:st.death,text})!==false)return;
      api.drawDeathTitle(data.death.cause,data.death.verb);
      const fatal=api.$('fatal-overlay');
      if(fatalBackground===null)fatalBackground=fatal.style.backgroundImage||'';
      fatal.style.backgroundImage=`linear-gradient(#16040bc4,#16040bc4),url("${api.assetUrl(data.death.background)}")`;
      const caption=fatal.querySelector('p');
      if(caption)caption.textContent=text;
      fatal.classList.add('visible');
      api.playUiSound(60);
    }
    function restoreFatalBackground(){
      if(fatalBackground===null)return;
      api.$('fatal-overlay').style.backgroundImage=fatalBackground;
      fatalBackground=null;
    }

    // ---------- Hinge options ----------
    function button(action,label,{risky=false,mark='☾',extra=''}={}){
      return `<button class="hinge-chat-choice chapel-choice ${risky?'risky':''} ${extra}" data-chapel-choice="${esc(action)}">${mark} ${esc(label)}</button>`;
    }
    // Returns {html, only}. With only=true the quest choices replace the
    // ordinary small-talk topics, keeping the list short on small phones.
    function optionsFor(thread){
      const st=sync();
      if(!st||!st.active||st.dead||!thread)return null;
      const id=thread.id;
      const involved=id===VICTORIA||GOTHS.includes(id)||SISTERS.includes(id);
      if(!involved)return null;
      if(st.outcome||st.withdrawn)return {html:`<div class="story-tag">${esc(st.outcome?'The night at the chapel is over.':'You walked away from the chapel case.')}</div>`,only:false};
      const mark=SISTERS.includes(id)?'✝':'☾';
      let choices=[];
      if(id===VICTORIA)choices=victoriaAvailable(st).map(act=>button(`v:${act}`,data.victoria.actions[act].label,{risky:act==='confront'||act==='accept'||act==='crescent'}));
      else if(GOTHS.includes(id)){
        if(st.goths[id].closed)return null;
        choices=gothAvailable(st,id).map(act=>button(`g:${id}:${act}`,data.gothActions[act].label,{risky:act==='accuse'}));
      }else{
        const s=st.sisters[id],def=data.sisters[id];
        if(s.lost)return null;
        choices=def.topics.filter(topic=>topicOpen(st,id,topic)).map(topic=>button(`s:${id}:${topic.id}`,topic.label,{risky:!!topic.risky,mark}));
        if(def.favour&&!s.favour)choices.push(button(`s:${id}:favour-offer`,def.favour.offerLabel,{mark}));
        if(def.favour&&s.favour?.state==='offered'){
          if(today()===s.favour.due)choices.push(button(`s:${id}:favour-do`,def.favour.doLabel,{mark}));
          else choices.push(`<div class="story-tag">Promised for tomorrow: ${esc(def.favour.doLabel)}</div>`);
        }
        choices.push(s.recruited?`<div class="story-tag">✝ ${esc(firstName(id))} will stand at the vigil.</div>`:button(`s:${id}:recruit`,def.recruit.label,{mark}));
      }
      if(!questMode.has(id)){
        const label=SISTERS.includes(id)?'Talk about the crescent marks and the vigil':'Talk about the Midnight Show';
        return {html:button(`qmode:${id}:on`,label,{mark,extra:'chapel-entry'}),only:false};
      }
      return {html:choices.join('')+button(`qmode:${id}:off`,'Back to small talk',{mark:'‹'}),only:true};
    }

    // ---------- case page (shown in the bedside cupboard) ----------
    function dots(st,id){
      const s=st.sisters[id],bar=joinBar(st,id);
      let out='';
      for(let i=1;i<=rules().trustMax;i++)out+=i<=s.trust?'●':(i===bar?'◇':'○');
      return out;
    }
    function personLine(st,id){
      const profile=api.profile(id);
      if(!profile)return '';
      let status='';
      if(id===VICTORIA)status=isClosed(VICTORIA)?'Not speaking to you.':st.wentAlone?'You promised to come to her after-party.':'Hosts the Midnight Show.';
      else{
        const g=st.goths[id];
        status=g.closed||isClosed(id)?'Not speaking to you.':[g.ally?'Wants out and will warn you.':'',g.warned?'Warned.':'',g.told?'Knows about the vigil.':''].filter(Boolean).join(' ')||'No read yet.';
      }
      const reads=id===VICTORIA?'':`<div class="chapel-row">${['innocent','sympathetic','dangerous'].map(role=>`<button class="chapel-btn ${st.reads[id]===role?'on':''}" data-chapel-choice="read:${id}:${role}">${cap(role)}</button>`).join('')}</div>`;
      return `<div class="chapel-person"><b>${esc(profile.name)}</b> <button class="chapel-btn" data-chapel-choice="msg:${id}">Message</button><small>${esc(status)}</small>${reads}</div>`;
    }
    function sisterLine(st,id){
      const profile=api.profile(id),s=st.sisters[id],def=data.sisters[id];
      if(!profile)return '';
      const known=s.done.length>0;
      const abilityNames={prayer:def.abilities.prayer==='full'?'Knows the whole Watch of Mercy':def.abilities.prayer==='partial'?'Can lead the prayer on a quiet night':'Cannot lead the prayer',keys:def.abilities.keys?'Carries the chapel keys':'No keys',watch:def.abilities.watch?'Can hold the door':'Should not keep watch',voices:def.abilities.extraVoices?`Brings ${def.abilities.extraVoices} extra voices`:'One voice'};
      const learnt=s.revealed.map(key=>abilityNames[key]).filter(Boolean);
      let status;
      if(s.lost||isClosed(id))status='Will not speak to you.';
      else if(s.recruited)status='✓ Will stand at the vigil.';
      else status=s.trust>=joinBar(st,id)?'Trusts you enough to ask.':`Needs ${joinBar(st,id)-s.trust} more trust.`;
      const favour=s.favour?.state==='offered'?(s.favour.due===today()?'You promised to help her today.':'You promised to help her tomorrow.'):s.favour?.state==='done'?'Favour kept.':s.favour?.state==='broken'?'Favour broken.':'';
      const canMessage=!!threadOf(id)||st.introduced;
      return `<div class="chapel-person"><b>${esc(profile.name)}</b> ${canMessage?`<button class="chapel-btn" data-chapel-choice="msg:${id}">Message</button>`:''}<small><span class="chapel-dots" aria-label="Trust ${s.trust} of ${rules().trustMax}">${dots(st,id)}</span> ${esc(status)}</small>${known?`<small>Values: ${esc(def.values)} Doubts: ${esc(def.doubts)}</small>`:''}${learnt.length?`<small>${esc(learnt.join('. '))}.</small>`:''}${favour||s.promise?`<small>${esc([favour,s.promise?(s.promiseBroken?'Promise broken.':'Promise made.'):''].filter(Boolean).join(' '))}</small>`:''}</div>`;
    }
    function statusText(st){
      if(st.dead)return 'Victoria found you.';
      if(st.outcome)return `${st.resultText} Case closed.`;
      if(st.withdrawn)return 'You walked away. The rite will go ahead without you.';
      const when=st.reading.when,where=st.reading.where;
      if(when)return `Your reading: the rite is ${relDays(when.day)}${where?` at ${placeName(where)}`:''}.`;
      if(where)return `Your reading: the rite is at ${placeName(where)}. You don't know when yet.`;
      return 'You don\'t yet know where or when the rite will happen.';
    }
    function caseHtml(st){
      const f=st.fragments,ally=f.allyPhrase?.source;
      const whereClues=[];
      if(f.show)whereClues.push(`Flyer margin: “Afterwards, ${data.places[st.location].phrase}.”`);
      if(f.allyPhrase)whereClues.push(`${firstName(ally)}: “It's afterwards, ${data.places[st.location].phrase}.”`);
      if(f.zaraLie)whereClues.push(`${firstName(f.zaraLie.source)}: “The after-party's at the Lantern Vault.”`);
      if(f.aftershow)whereClues.push(fill('Chalk crescents appeared on {chalkA} and {chalkB}.'));
      const lore=f.lore||f.heritage?CHAPELS.map(key=>data.places[key].lore):[];
      const whenClues=[];
      if(f.diary)whenClues.push(`Victoria's diary: “${data.diaryPhrase}”`);
      if(f.show)whenClues.push(`The Midnight Show is ${relDays(st.showDay)}.`);
      if(f.skywatch)whenClues.push(`The moon disappears completely ${relDays(f.skywatch.moonlessDay??st.originalRitualDay)}.`);
      if(f.allyWarning)whenClues.push(`${firstName(f.allyWarning.source)} warned that the rite is now ${relDays(f.allyWarning.ritualDay)}.`);
      const list=items=>items.length?`<ul>${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:'<p>Nothing yet. Read the news and talk to people.</p>';
      const placeButtons=action=>PLACES.map(key=>`<button class="chapel-btn ${(action==='where'?st.reading.where:st.draft.place)===key?'on':''}" data-chapel-choice="${action}:${key}">${esc(placeShort(key))}</button>`).join('');
      const whenButtons=whenOptions(st).map(option=>`<button class="chapel-btn ${st.reading.when?.source===option.key?'on':''}" data-chapel-choice="when:${option.key}">${esc(option.label)}</button>`).join('');
      const recruited=recruitedSisters(st);
      const slotNames={prayer:'Leads the prayer',keys:'Holds the keys',watch:'Keeps watch at the door'};
      let vigilHtml;
      if(st.outcome)vigilHtml='<p>The vigil is over.</p>';
      else if(st.withdrawn)vigilHtml='<p>You walked away. There will be no vigil.</p>';
      else if(st.refuseVigils&&!st.vigil)vigilHtml=`<p class="chapel-danger">${esc(data.messages.refuseVigils)}</p>`;
      else if(st.vigil){
        const v=st.vigil;
        vigilHtml=`<p>Word sent: <b>${esc(placeName(v.place))}</b>, ${esc(relDays(v.day))}.</p><ul>${SLOTS.map(slot=>`<li>${slotNames[slot]}: ${esc(v[slot]?nameOf(v[slot])+(st.sisters[v[slot]].recruited?'':' (no longer coming)'):'nobody')}</li>`).join('')}</ul><p>Voices gathered: ${voices(st)}</p><button class="chapel-btn warn" data-chapel-choice="vigil-cancel">Call off the vigil</button>`;
      }else{
        const slotRow=slot=>`<p><b>${slotNames[slot]}</b></p><div class="chapel-row">${recruited.map(id=>`<button class="chapel-btn ${st.draft[slot]===id?'on':''}" data-chapel-choice="slot:${slot}:${id}">${esc(firstName(id))}</button>`).join('')}<button class="chapel-btn ${st.draft[slot]?'':'on'}" data-chapel-choice="slot:${slot}:none">Nobody</button></div>`;
        vigilHtml=`${recruited.length?'':'<p>No Sister has agreed to stand with you yet.</p>'}${SLOTS.map(slotRow).join('')}<p>Voices gathered: ${voices(st)}</p><p><b>Chapel</b></p><div class="chapel-row">${placeButtons('vplace')}</div><p><b>Night</b></p><div class="chapel-row"><button class="chapel-btn" data-chapel-choice="vnight:-">−</button><span>${esc(relDays(today()+st.draft.nights))}</span><button class="chapel-btn" data-chapel-choice="vnight:+">+</button></div><button class="notes-call" data-chapel-choice="vigil-send">✝ Send word to the Sisters</button>${st.vigilError?`<p class="chapel-danger">${esc(st.vigilError)}</p>`:''}`;
      }
      const sisterIntro=st.introduced?'':'<p>Call St Brigid\'s Chapel (number in Contacts) and ask about the crescent marks to be introduced.</p>';
      const danger=st.marks>0&&!st.outcome?'<p class="chapel-danger">Victoria knows who you are.</p>':'';
      const walkAway=st.outcome||st.withdrawn?'':walkAwayArmed?
        '<p class="chapel-danger">Walk away for good? The Sisters will not wait for you.</p><div class="chapel-row"><button class="chapel-btn warn" data-chapel-choice="walk-away-confirm">Yes, walk away</button><button class="chapel-btn" data-chapel-choice="walk-away-cancel">Stay on the case</button></div>':
        '<button class="chapel-btn warn" data-chapel-choice="walk-away">Walk away from all this</button>';
      return `<div class="chapel-case"><button class="profile-back chapel-back" data-chapel-choice="close-case">‹ Cupboard</button><h3>☾ The Chapel at Midnight</h3><p class="chapel-status">${esc(statusText(st))}</p>${danger}`+
        `<h4>Decipher: where?</h4><div class="paper">${list(whereClues)}${lore.length?`<p><b>Chapel lore</b></p>${list(lore)}`:''}<div class="chapel-row">${placeButtons('where')}</div></div>`+
        `<h4>Decipher: when?</h4><div class="paper">${list(whenClues)}${whenButtons?`<div class="chapel-row">${whenButtons}</div>`:''}</div>`+
        `<h4>The goth crowd</h4><div class="paper">${[VICTORIA,...GOTHS].map(id=>personLine(st,id)).join('')}</div>`+
        `<h4>Sisters of Mercy</h4><div class="paper">${sisterIntro}${SISTERS.map(id=>sisterLine(st,id)).join('')}</div>`+
        `<h4>The vigil</h4><div class="paper">${vigilHtml}</div>`+
        `<h4>Case journal</h4><div class="paper">${list(st.journal.slice(-6).reverse().map(entry=>`Day ${entry.day}: ${entry.text}`))}</div>${walkAway}</div>`;
    }
    function renderCase(){
      const st=sync();
      if(!st)return;
      caseOpen=true;
      const el=api.caseRoot?api.caseRoot():api.$('opened'); // the host decides where the case page lives
      el.innerHTML=caseHtml(st);
      api.hydrate(el);
    }
    function notesEntry(){
      caseOpen=false;walkAwayArmed=false;
      const st=sync();
      if(!st||!st.active)return '';
      return `<h3>Cases</h3><div class="paper"><button class="notes-call" data-chapel-choice="open-case">☾ The Chapel at Midnight ›</button><p>${esc(statusText(st))}</p></div>`;
    }

    // ---------- player choices ----------
    function message(st,id){
      const profile=api.profile(id);
      if(!profile)return;
      let thread=threadOf(id);
      if(!thread&&SISTERS.includes(id)&&!st.introduced)return;
      if(!thread){thread=api.ensureThread(profile);thread.log=[];}
      if(!thread.log.length){
        if(GOTHS.includes(id))thread.log.push({who:'you',text:data.goths[id].contactPlayer},{who:'her',text:data.goths[id].contactReply});
        else if(SISTERS.includes(id))thread.log.push({who:'her',text:fill(data.sisters[id].intro)});
        else thread.log.push({who:'her',text:data.victoria.opening});
      }
      if(!thread.blocked&&!thread.fumbled){thread.awaiting=false;thread.ghosted=false;}
      caseOpen=false;
      questMode.add(id);
      api.openChat(id);
    }
    function choose(action){
      const st=sync();
      if(!st)return;
      const [kind,a,b]=String(action).split(':');
      if(st.dead&&kind!=='close-case')return;
      switch(kind){
        case 'open-case':caseOpen=true;walkAwayArmed=false;renderCase();return;
        case 'close-case':caseOpen=false;if(api.closeCase)api.closeCase();else api.openApp('notes');return;
        case 'msg':message(st,a);return;
        case 'qmode':if(b==='on')questMode.add(a);else questMode.delete(a);api.rerender();return;
        case 'g':gothAct(st,a,b);return;
        case 'v':victoriaAct(st,a);return;
        case 's':sisterAct(st,a,b);return;
        case 'read':if(GOTHS.includes(a)&&ROLES.includes(b)){if(st.reads[a]===b)delete st.reads[a];else st.reads[a]=b;}break;
        case 'where':setWhere(st,a);break;
        case 'when':setWhen(st,a);break;
        case 'slot':assignSlot(st,a,b);break;
        case 'vplace':if(PLACES.includes(a)&&!st.vigil)st.draft.place=a;break;
        case 'vnight':if(!st.vigil)st.draft.nights=Math.max(1,Math.min(9,st.draft.nights+(a==='+'?1:-1)));break;
        case 'vigil-send':sendVigil(st);break;
        case 'vigil-cancel':if(st.vigil&&!st.outcome){journal(st,'You called off the vigil.');st.vigil=null;}break;
        case 'walk-away':walkAwayArmed=true;break;
        case 'walk-away-cancel':walkAwayArmed=false;break;
        case 'walk-away-confirm':
          if(!st.outcome&&!st.withdrawn){st.withdrawn=true;st.vigil=null;walkAwayArmed=false;journal(st,'You walked away from the chapel case.');}
          break;
        default:return;
      }
      refresh();
    }

    // ---------- run lifecycle ----------
    function reset(){
      clearTimers();hideOverlay();restoreFatalBackground();
      caseOpen=false;walkAwayArmed=false;questMode.clear();
      ensureServiceTopic(false);
    }
    function afterLoad(){
      clearTimers();hideOverlay();restoreFatalBackground();
      caseOpen=false;walkAwayArmed=false;questMode.clear();
      const world=api.world();
      if(!data||!world)return;
      world.chapel=normalize(world.chapel,world);
      const st=state();
      ensureServiceTopic(st.active);
      if(st.dead){showDeath(deathKind(st));return;}
      if(st.attackRunning||st.attackPending){startAttack(st.attackReason);return;}
      if(st.warningPending){st.warningPending=false;showWarning(st);}
    }
    // Workbench shortcut: open the case today instead of waiting for day two.
    function previewNow(){
      const st=state();
      if(!st)return false;
      if(!st.active)activate(st);
      api.status('The Chapel at Midnight is open. Victoria has messaged you; the case file is in your bedside cupboard.');
      caseOpen=false;
      if(api.showCase)api.showCase();else api.openApp('notes');
      return true;
    }
    // Workbench shortcut: play Victoria's attack now, in the room's current
    // lighting, like the bear preview. Always fatal. The game starts a fresh
    // run first if the player is already dead.
    function previewAttack(){
      const st=state();
      if(!st||st.dead||st.attackRunning)return false;
      startAttack('confront');
      return true;
    }

    mount();
    const previewButton=api.$('chapel-preview');
    if(previewButton&&previewButton.addEventListener)previewButton.addEventListener('click',()=>{if(!state()?.dead)previewNow();});

    return {
      statusLine:()=>{const st=sync();return st?statusText(st):'';},
      onNewDay,afterDayStart,decorateEdition,optionsFor,choose,notesEntry,renderCase,afterLoad,reset,previewNow,previewAttack,
      isCaseOpen:()=>caseOpen,
      hasData:()=>!!data,
      // Read-only helpers for tests and debugging.
      state:()=>sync(),voices:()=>{const st=state();return st?voices(st):0;},threshold:()=>{const st=state();return st?threshold(st):null;},
      overlay:()=>({image:overlayImage?.src||'',caption:overlayCaption?.textContent||'',visible:!!overlay?.classList.contains('visible')})
    };
  }

  root.MATCH_CHAPEL_ENGINE={create,attackFrame,LIGHTING,STAGES,ids:{VICTORIA,MARGARET,TERESA,SOPHIA,EVELYN,GOTHS,SISTERS}};
})(typeof window!=='undefined'?window:globalThis);

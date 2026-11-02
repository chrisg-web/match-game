/* MATCH: marriage, the way to win. Marry a Sister of Mercy, or be married off by the
 * Bluebirds at the end of Professor Vale (thunderbirdWedding below).
 *
 * preview.html loads this file before its own script and creates one engine with
 * MATCH_MARRIAGE_ENGINE.create(api). The game calls a few hooks, all marked
 * "Marriage" in preview.html. If this file is missing, every hook is skipped and
 * the game runs as before.
 *
 * All state lives in world.marriage (saved, loaded and reset with the run). The
 * win itself is recorded in world.victory, which nothing else in the game sets.
 * world.marriage.tb holds the Bluebird wedding; one wedding per run, either kind.
 * Text, the five Sisters' lines, the jewellers and all 50 examination questions
 * live in marriage.json.
 *
 * Progression (the exam and the ring can happen in either order):
 *   1. In Hinge, ask a Sister of Mercy whether she would ever marry you.
 *   2. Her examination: five correct answers in a row. A wrong answer resets the
 *      count and starts a new attempt; no question repeats within an attempt.
 *      Passing is permanent and recorded separately for each Sister.
 *   3. Ring one of five Sunfall jewellers (match with her on Hinge and ask for her number). Each has a
 *      different conversation that ends with a free wedding ring, which then
 *      appears on the desk. There is no inventory: the ring is one saved flag.
 *   4. Propose in her chat. Without a ring: "Wait, without a ring?". With one:
 *      her four-picture wedding slideshow, then JUST MARRIED. One marriage per run.
 */
(function(root){
  'use strict';
  // The five Sisters with their own written lines and wedding art. Every other Sister of
  // Mercy in the roster can be married too (sisterIds below), using shared lines and, until
  // her own wedding pictures exist, her own photographs in the slideshow.
  const SISTERS=['MATCH-007','MATCH-055','MATCH-056','MATCH-057','MATCH-066'];
  const SISTER_ID=/^MATCH-\d{3}$/;
  const JEWELLERS=['agnes','rafael','clara','joseph','sofia'];
  const LETTERS=['A','B','C','D'];
  const QUESTIONS_PER_DAY_MAX=5;
  const lineId=id=>'service:jeweller-'+id;
  const SLIDE_MS=5200;
  const STYLE=`
    .desk-ring{position:absolute;display:none;z-index:3;width:7%;left:19%;top:46.9%;image-rendering:pixelated;pointer-events:none;filter:drop-shadow(0 2px 2px #0008)} /* on the bedside table, right of the alarm clock, on every preset */
    .desk-ring.visible{display:block}
    .marriage-show{display:none;position:absolute;z-index:30;inset:0;background:#120c09;overflow:hidden;cursor:pointer}
    .marriage-show.visible{display:block}
    .marriage-show img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;opacity:0;transform:scale(1.02);transition:opacity 1.4s ease-in-out}
    .marriage-show img.on{opacity:1;animation:marriageDrift 6.6s ease-out forwards}
    @keyframes marriageDrift{from{transform:scale(1.02)}to{transform:scale(1.07)}}
    .marriage-win{display:none;position:absolute;z-index:31;inset:0;overflow:hidden;background:#1c120c;color:#fff4dc;text-align:center}
    .marriage-win.visible{display:block;animation:marriageWinIn 1.6s ease-out both}
    .marriage-win .backdrop{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;opacity:.55}
    .marriage-win .veil{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 38%,#fff3d433 0,#2a180e99 55%,#120a06ee 100%)}
    .marriage-win .card{position:absolute;left:7%;right:7%;top:9%;bottom:7%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
    .marriage-win .frame{width:64%;aspect-ratio:3/4;border:5px solid #e6c066;border-radius:6px;box-shadow:0 0 0 3px #5b3b13,0 10px 30px #000c;background:#2b1b10;overflow:hidden}
    .marriage-win .frame img{width:100%;height:100%;object-fit:cover;image-rendering:pixelated}
    .marriage-win h2{margin:6px 0 0;font:900 34px/1 'Trebuchet MS',Tahoma,sans-serif;letter-spacing:.12em;color:#ffd978;text-shadow:0 3px 0 #6b4210,0 0 18px #ffcf6a88}
    .marriage-win .sub{margin:0;font:italic bold 16px/1.3 Georgia,serif;color:#fff1d6}
    .marriage-win .line{margin:0;font:bold 12px/1.4 'Trebuchet MS',Tahoma,sans-serif;letter-spacing:.06em;color:#f5dcae}
    .marriage-win button{margin-top:6px;min-height:40px;padding:8px 18px;font:bold 13px 'Trebuchet MS',Tahoma,sans-serif;color:#2b1b10;background:#ffd978;border:2px solid #fff1c4;border-radius:5px;cursor:pointer}
    .marriage-win .note{margin:0;font:11px/1.3 'Trebuchet MS',Tahoma,sans-serif;color:#d9c39b}
    @keyframes marriageWinIn{from{opacity:0}to{opacity:1}}
    .marriage-choice.propose{border-color:#e6c066!important}
    .marriage-choice.marriage-waiting{opacity:.55;cursor:default;filter:grayscale(.6)}
    @media (prefers-reduced-motion: reduce){.marriage-show img{transition:none}.marriage-show img.on{animation:none}.marriage-win.visible{animation:none}}
  `;

  // Quest randomness comes from the run seed and a saved counter, so it never
  // disturbs the game's own random numbers and replays identically after loading.
  function seeded(text){
    let hash=2166136261;
    for(const char of String(text)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
    let x=(hash>>>0)||1;
    return ()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};
  }

  function create(api){
    let data=root.MATCH_MARRIAGE_DATA||null;
    let slideTimers=[],showing=null,mounted=false;
    let deskRing=null,show=null,showImages=[],win=null;
    if(!data&&typeof root.fetch==='function'){
      // The linked-asset preview.html loads the JSON; the standalone build inlines it.
      const stamp=root.document?.documentElement?.getAttribute?.('data-build'); // online editions: this build's version
      root.fetch('marriage.json'+(stamp?`?v=${stamp}`:'')).then(response=>response.json()).then(json=>{data=json;afterLoad();}).catch(()=>{});
    }

    // ---------- state ----------
    function freshSister(){return {started:false,passed:false,active:false,streak:0,asked:[],current:null,attempts:0,draws:0,best:0,proposedWithoutRing:0,day:null,todayCount:0};}
    function freshJeweller(){return {asked:false,church:false,favourAsked:false,chapelTold:false,orderedDay:null,ready:false,met:false};}
    function freshState(){
      return {v:1,sisters:Object.fromEntries(SISTERS.map(id=>[id,freshSister()])),
        ring:null,jewellers:Object.fromEntries(JEWELLERS.map(id=>[id,freshJeweller()])),numbers:{},married:null,tb:null};
    }
    function normalize(raw){
      const out=freshState();
      if(!raw||typeof raw!=='object'||raw.v!==1)return out;
      const int=v=>(Number.isInteger(v)?v:null);
      const ids=new Set((data?.questions||[]).map(q=>q.id));
      for(const id of Object.keys(raw.sisters||{}).filter(key=>SISTER_ID.test(key))){
        const s=raw.sisters[id];
        if(!s||typeof s!=='object')continue;
        const o=out.sisters[id]||(out.sisters[id]=freshSister());
        for(const key of ['started','passed','active'])o[key]=s[key]===true;
        for(const key of ['streak','attempts','draws','best','proposedWithoutRing'])o[key]=Math.max(0,int(s[key])||0);
        o.day=int(s.day)!==null&&s.day>0?s.day:null;
        o.todayCount=Math.min(QUESTIONS_PER_DAY_MAX,Math.max(0,int(s.todayCount)||0));
        o.asked=Array.isArray(s.asked)?[...new Set(s.asked.filter(q=>ids.has(q)))].slice(-10):[];
        o.current=ids.has(s.current)?s.current:null;
        // Each right answer in this attempt is a question already asked, so a streak that is
        // impossible (too long, or longer than the questions asked) is a bad save: reset it.
        if(o.streak>=(data?.rules?.streakToPass||5)||o.streak>o.asked.length)o.streak=0;
        if(o.passed){o.active=false;o.current=null;o.asked=[];o.streak=0;}
        if(o.active&&o.current===null)o.active=false;
      }
      if(raw.ring&&JEWELLERS.includes(raw.ring.from))out.ring={from:raw.ring.from,day:int(raw.ring.day)};
      for(const id of JEWELLERS){
        const j=raw.jewellers?.[id];
        if(!j||typeof j!=='object')continue;
        const o=out.jewellers[id];
        for(const key of ['asked','church','favourAsked','chapelTold','ready','met'])o[key]=j[key]===true;
        o.orderedDay=int(j.orderedDay);
      }
      if(raw.numbers&&typeof raw.numbers==='object')for(const id of JEWELLERS)if(typeof raw.numbers[id]==='string'&&/^\d{7}$/.test(raw.numbers[id]))out.numbers[id]=raw.numbers[id];
      // Only a Sister of Mercy (with her own lines, or any Sister in the roster) can be the bride.
      if(raw.married&&SISTER_ID.test(String(raw.married.id))&&sister(raw.married.id))out.married={id:raw.married.id,day:int(raw.married.day)};
      // The Bluebird wedding: only a Bluebird, and only if there was no Sister's wedding.
      else if(raw.tb&&SISTER_ID.test(String(raw.tb.id))&&api.profile?.(raw.tb.id)?.factionId==='thunderbirds')out.tb={id:raw.tb.id,day:int(raw.tb.day)};
      return out;
    }
    function state(){
      if(!data)return null;
      const world=api.world();
      if(!world)return null;
      if(!world.marriage||world.marriage.v!==1)world.marriage=freshState();
      return world.marriage;
    }
    const today=()=>api.world().day;
    // Every Sister of Mercy: her own lines if she has them, otherwise shared ones.
    const sister=id=>data?.sisters?.[id]||sharedSister(id);
    const sharedCache=new Map();
    function sharedSister(id){
      if(sharedCache.has(id))return sharedCache.get(id);
      const profile=api.profile?.(id),pool=data?.sharedSister;
      if(!profile||profile.factionId!=='sisters_of_mercy'||!pool)return null;
      const rnd=seeded(`sister:${id}`);
      const one=list=>list[Math.floor(rnd()*list.length)];
      const some=(list,count)=>{const left=list.slice(),out=[];while(out.length<count&&left.length)out.push(left.splice(Math.floor(rnd()*left.length),1)[0]);return out;};
      const first=profile.name.split(' ')[0];
      const made={name:profile.name,slug:profile.slug,shared:true,start:one(pool.start),player:fill(one(pool.player),{first}),intro:one(pool.intro),resume:one(pool.resume),pause:one(pool.pause),
        correct:some(pool.correct,4),wrong:some(pool.wrong,4),pass:one(pool.pass),noRing:one(pool.noRing),accept:one(pool.accept)};
      sharedCache.set(id,made);
      return made;
    }
    function sisterIds(){return [...new Set([...Object.keys(data?.sisters||{}),...(api.sisterIds?.()||[])])].filter(id=>sister(id));}
    const sisterState=(st,id)=>st.sisters[id]||(st.sisters[id]=freshSister());
    const wed=st=>st.married||st.tb; // already married, either way
    const brideName=id=>sister(id)?.name||api.profile?.(id)?.name||'her';
    const firstName=id=>(sister(id)?.name||'her').split(' ')[0];
    const question=qid=>data.questions.find(q=>q.id===qid);
    // At most two examination questions a day for each Sister (data.rules.questionsPerDay).
    const perDay=()=>Math.max(1,Math.min(QUESTIONS_PER_DAY_MAX,data?.rules?.questionsPerDay||2));
    const askedToday=s=>s.day===today()?s.todayCount:0;
    const canAsk=s=>askedToday(s)<perDay();
    function countAnswer(s){if(s.day!==today()){s.day=today();s.todayCount=0;}s.todayCount++;}
    const dayDoneLine=(id,key)=>pick(data?.rules?.dayDone||['That’s enough for today. Ask me again tomorrow.'],key+':done');
    const threadOf=id=>api.threads().get(id);
    const esc=value=>api.esc(value);
    const fill=(text,vars)=>String(text||'').replace(/\{(\w+)\}/g,(match,key)=>vars&&vars[key]!=null?String(vars[key]):match);
    function pick(list,key){const rnd=seeded(`${api.world().seed||'match'}:marriage:${key}`);return list[Math.floor(rnd()*list.length)];}

    // ---------- Hinge: examination and proposal ----------
    function button(action,label,{mark='💍',extra=''}={}){
      return `<button class="hinge-chat-choice marriage-choice ${extra}" data-marriage-choice="${esc(action)}">${mark?mark+' ':''}${esc(label)}</button>`;
    }
    function tag(text){return `<div class="story-tag">${esc(text)}</div>`;}
    // You can only ask a Sister about marriage once she knows you: she has given you her
    // number, or you have talked properly on the app (rules.talkBeforeAsking exchanges).
    function knowsYou(thread){
      return !!thread?.number||(thread?.topics||[]).length>=(data?.rules?.talkBeforeAsking||6);
    }
    // Returns {html, only}. With only=true the examination answers replace the
    // ordinary chat topics until she has asked her question and you have answered.
    function optionsFor(thread){
      const st=state();
      if(!st||!thread||!sister(thread.id)||thread.blocked||thread.fumbled)return null; // she blocked you: no examination
      const id=thread.id,s=sisterState(st,id);
      if(wed(st))return {html:tag(st.married?.id===id?'Married. God bless you both.':'You are already married.'),only:true};
      if(!s.started&&!s.passed&&!knowsYou(thread))return null; // too soon to ask
      if(s.active&&s.current!==null){
        const q=question(s.current);
        const answers=q.answers.map((answer,index)=>button(`answer:${id}:${index}`,`${LETTERS[index]}. ${answer}`,{mark:'',extra:'marriage-answer'})).join('');
        return {html:tag(`Her examination · ${s.streak} of ${data.rules.streakToPass} in a row`)+answers+button(`pause:${id}`,'Ask to stop for now',{mark:'‹'}),only:true};
      }
      if(s.passed)return {html:button(`propose:${id}`,`Propose to ${firstName(id)}`,{extra:'propose'}),only:false};
      if(s.started&&!canAsk(s))return {html:`<button class="hinge-chat-choice marriage-choice marriage-waiting" disabled>💍 ${esc(firstName(id))}’s next questions tomorrow (${s.streak} in a row)</button>`,only:false};
      const label=s.started?`Continue her examination (${s.streak} in a row)`:sister(id).start;
      return {html:button(`start:${id}`,label),only:false};
    }
    // Shows the player's line, a typing bubble, then one or more replies.
    function converse(id,playerText,replies,after){
      const thread=threadOf(id),profile=api.profile(id);
      if(!thread||!profile||thread.pending||thread.blocked||thread.fumbled)return false;
      const seed=api.world().seed;
      thread.log.push({who:'you',text:playerText});
      thread.pending=true;
      api.rerender();
      api.later(()=>{
        thread.pending=false;
        if(api.world().seed!==seed)return; // a new run started meanwhile
        for(const text of replies)if(text)thread.log.push({who:'her',text});
        if(after)after();
        api.rerender();
      },api.replyDelay(profile,'marriage'));
      return true;
    }
    function draw(st,id){
      const s=sisterState(st,id);
      const pool=data.questions.filter(q=>!s.asked.includes(q.id));
      const rnd=seeded(`${api.world().seed||'match'}:marriage:${id}:${s.draws}`);
      s.draws++;
      const q=pool[Math.floor(rnd()*pool.length)];
      s.current=q.id;s.asked.push(q.id);
      return q;
    }
    function start(st,id){
      const s=sisterState(st,id),sis=sister(id);
      if(s.passed||wed(st)||!canAsk(s))return;
      const opening=s.started?sis.resume:sis.intro;
      const firstTime=!s.started;
      const q=s.current!==null?question(s.current):null;
      converse(id,firstTime?sis.player:'Shall we carry on with the examination?',[opening],()=>{
        s.started=true;s.active=true;
        const next=q||draw(st,id);
        threadOf(id).log.push({who:'her',text:next.question});
      });
    }
    function answer(st,id,index){
      const s=sisterState(st,id),sis=sister(id);
      if(!s.active||s.current===null||!(index>=0&&index<4))return;
      const q=question(s.current);
      const correct=index===q.correctAnswerIndex;
      const key=`${id}:${s.draws}:${s.attempts}`;
      converse(id,`${LETTERS[index]}. ${q.answers[index]}`,[],()=>{
        const thread=threadOf(id);
        countAnswer(s);
        if(correct){
          s.streak++;s.best=Math.max(s.best,s.streak);
          if(s.streak>=data.rules.streakToPass){
            s.passed=true;s.active=false;s.current=null;s.asked=[];s.streak=0;
            thread.log.push({who:'her',text:sis.pass});
            api.status(`${sis.name} says you passed. You may now propose to her.`);
            api.save();
            return;
          }
          thread.log.push({who:'her',text:pick(sis.correct,key+':c')});
        }else{
          s.streak=0;s.asked=[];s.attempts++;
          thread.log.push({who:'her',text:pick(sis.wrong,key+':w')});
        }
        if(!canAsk(s)){ // that's her two for today
          s.active=false;s.current=null;
          thread.log.push({who:'her',text:dayDoneLine(id,key)});
          api.save();
          return;
        }
        thread.log.push({who:'her',text:draw(st,id).question});
      });
    }
    function pause(st,id){
      const s=sisterState(st,id);
      if(!s.active)return;
      converse(id,'Can we stop there for now?',[sister(id).pause],()=>{s.active=false;});
    }
    function propose(st,id){
      const s=sisterState(st,id),sis=sister(id);
      if(!s.passed||wed(st))return;
      if(!st.ring){
        s.proposedWithoutRing++;
        converse(id,`${firstName(id)}, will you marry me?`,[data.rules.noRingReply,sis.noRing]);
        return;
      }
      converse(id,`${firstName(id)}, will you marry me?`,[sis.accept],()=>marry(st,id));
    }
    function marry(st,id){
      if(wed(st))return;
      st.married={id,day:today()};
      // The single place in the game that records a win.
      api.world().victory={type:'marriage',bride:id,day:today()};
      refreshDesk();
      api.status(`${sister(id).name} said yes. You won Matchfall.`);
      api.save();
      playWedding(id,false);
    }
    // Professor Vale's Bluebird ending: the gala ball, a vote, a wedding. The other way to win.
    function thunderbirdWedding(id){
      const st=state();
      if(!st||wed(st)||sister(id)||api.profile?.(id)?.factionId!=='thunderbirds')return false;
      st.tb={id,day:today()};
      api.world().victory={type:'thunderbirds',bride:id,day:today()};
      refreshDesk();
      api.status(fill(data.thunderbirds.status,{name:brideName(id)}));
      api.save();
      playWedding(id,false);
      return true;
    }
    function choose(action){
      const st=state();
      if(!st)return;
      const [kind,id,extra]=String(action).split(':');
      if(!sister(id))return;
      if(kind==='start'){const s=sisterState(st,id);if(s.started||s.passed||knowsYou(threadOf(id)))start(st,id);}
      else if(kind==='answer')answer(st,id,Number(extra));
      else if(kind==='pause')pause(st,id);
      else if(kind==='propose')propose(st,id);
    }

    // ---------- jewellers (phone calls) ----------
    function ensureNumbers(st){
      for(const id of JEWELLERS)if(!st.numbers[id])st.numbers[id]=api.newNumber();
    }
    function contactForNumber(number){
      const st=state();
      if(!st)return null;
      ensureNumbers(st);
      const id=JEWELLERS.find(key=>st.numbers[key]===String(number)&&st.jewellers[key]?.met);
      if(!id)return null;
      const j=data.jewellers[id];
      return {id:lineId(id),name:`${j.name}, ${j.shop}`,portrait:j.portrait,greeting:j.greeting};
    }
    function matchedSisters(){
      return sisterIds().filter(id=>{const thread=threadOf(id);return thread&&!thread.blocked&&!thread.fumbled;});
    }
    function topic(id,key,extra){return {id:key,label:extra?.label||data.jewellerTalk[id][key].label,marriage:true};}
    // Topics for a jeweller's line, plus Rafaela Ortega's favour (key 'rafael') on the chapel line.
    function serviceTopics(serviceId){
      const st=state();
      if(!st||wed(st))return [];
      if(serviceId==='service:chapel'){
        const r=st.jewellers.rafael;
        return r.favourAsked&&!r.chapelTold?[{id:'rafael-clock',label:data.jewellerTalk.rafael.chapelTopic.label,marriage:true}]:[];
      }
      const id=JEWELLERS.find(key=>lineId(key)===serviceId);
      if(!id)return [];
      if(st.ring)return [{id:'have-ring',label:data.jewellerTalk.haveRing.label,marriage:true}];
      const j=st.jewellers[id];
      switch(id){
        case 'agnes':return !j.asked?[topic(id,'ask')]:!j.church?[topic(id,'church'),topic(id,'discount')]:[topic(id,'listen')];
        case 'rafael':return !j.favourAsked?[topic(id,'ask')]:!j.chapelTold?[topic(id,'waiting')]:[topic(id,'done')];
        case 'clara':{
          if(!j.asked)return [topic(id,'ask')];
          const brides=matchedSisters();
          return brides.length?brides.map(sid=>({id:'bride-'+sid,label:fill(data.jewellerTalk.clara.bride.label,{name:sister(sid).name}),marriage:true})):[topic(id,'noOne')];
        }
        case 'joseph':
          if(j.orderedDay===null)return [topic(id,'order')];
          if(!j.ready)return [today()>=j.orderedDay+2?topic(id,'ready'):topic(id,'notReady')];
          return [topic(id,'marriage'),topic(id,'gesture')];
        case 'sofia':return !j.asked?[topic(id,'ask')]:[topic(id,'app'),topic(id,'knee'),topic(id,'drive')];
        default:return [];
      }
    }
    function giveRing(st,from){
      if(st.ring)return false;
      st.ring={from,day:today()};
      refreshDesk();
      api.status(data.rules.ringArrived);
      api.save();
      return true;
    }
    // Returns what the other person says.
    function chooseServiceTopic(serviceId,key){
      const st=state();
      if(!st||!serviceTopics(serviceId).some(item=>item.id===key))return '';
      const talk=data.jewellerTalk;
      if(serviceId==='service:chapel'){st.jewellers.rafael.chapelTold=true;return talk.rafael.chapelTopic.reply;}
      if(key==='have-ring')return talk.haveRing.reply;
      const id=JEWELLERS.find(k=>lineId(k)===serviceId);
      const j=st.jewellers[id],t=talk[id];
      switch(`${id}:${key.startsWith('bride-')?'bride':key}`){
        case 'agnes:ask':j.asked=true;return t.ask.reply;
        case 'agnes:discount':return t.discount.reply;
        case 'agnes:church':j.church=true;return t.church.reply+(threadOf('MATCH-056')?t.church.teresa:'');
        case 'agnes:listen':giveRing(st,'agnes');return t.listen.reply;
        case 'rafael:ask':j.favourAsked=true;return t.ask.reply;
        case 'rafael:waiting':return t.waiting.reply;
        case 'rafael:done':giveRing(st,'rafael');return t.done.reply;
        case 'clara:ask':j.asked=true;return t.ask.reply;
        case 'clara:noOne':return t.noOne.reply;
        case 'clara:bride':{const sid=key.slice(6);giveRing(st,'clara');return fill(t.bride.reply,{history:t.history[sid]});}
        case 'joseph:order':j.orderedDay=today();return t.order.reply;
        case 'joseph:notReady':return t.notReady.reply;
        case 'joseph:ready':j.ready=true;return t.ready.reply;
        case 'joseph:gesture':return t.gesture.reply;
        case 'joseph:marriage':giveRing(st,'joseph');return t.marriage.reply;
        case 'sofia:ask':j.asked=true;return t.ask.reply;
        case 'sofia:app':return t.app.reply;
        case 'sofia:drive':return t.drive.reply;
        case 'sofia:knee':giveRing(st,'sofia');return t.knee.reply;
        default:return '';
      }
    }

    // ---------- the Wedding box (bedside cupboard) and Contacts ----------
    // The jewellers' numbers reach Contacts once you've begun any Sister's examination
    // (she tells you to find a ring), or once you have the ring.
    // A jeweller is in your Contacts only once you've matched with her on Hinge and asked for her number.
    function jewellersKnown(st){return !!(st&&JEWELLERS.some(id=>st.jewellers[id]?.met));}
    function jewellerContacts(){
      const st=state();
      if(!jewellersKnown(st))return [];
      ensureNumbers(st);
      return JEWELLERS.filter(id=>st.jewellers[id].met).map(id=>({id,name:data.jewellers[id].name,shop:data.jewellers[id].shop,number:st.numbers[id],portrait:data.jewellers[id].portrait}));
    }
    function jewellerName(id){return data?.jewellers?.[id]?.name||'';}
    function notesEntry(options={}){
      const st=state();
      if(!st)return '';
      ensureNumbers(st);
      const ring=st.ring?`On your bedside table, a gift from ${data.jewellers[st.ring.from].name}.`:jewellersKnown(st)?'Not yet. Ring a jeweler from your Contacts.':'Not yet. Find a jeweler on Hinge and ask for her number.';
      const exams=matchedSisters().map(id=>{ // a Sister who blocked you is out of the running
        const s=sisterState(st,id);
        const status=st.married?.id===id?'married ♥':s.passed?'passed her examination. You may propose.':s.started?`examination in progress (${s.streak} in a row)`:'not asked yet';
        return `<p>• ${esc(sister(id).name)}: ${esc(status)}</p>`;
      }).join('')||'<p>Match with a Sister of Mercy in Hinge and ask whether she would ever marry you.</p>';
      const shops=JEWELLERS.map(id=>{
        const j=data.jewellers[id];
        return `<p class="contact-entry"><b>${esc(j.name)}</b>, ${esc(j.shop)}<br><small>${esc(j.role)} · ${esc(j.location)}</small><br><button class="notes-call" data-note-dial="${st.numbers[id]}">${st.numbers[id]} ☎</button></p>`;
      }).join('');
      return `<h3>💍 Marriage</h3><div class="paper"><p>${esc(data.fellowship)} Marry one of them to win. Get to know her first (talk properly, or get her number) before you ask. Then pass her examination (five correct answers in a row), get a wedding ring, and propose.</p><p><b>Wedding ring:</b> ${esc(ring)}</p><p><b>Examinations</b></p>${exams}${options.shops===false?'':`<p><b>Sunfall jewelers</b></p>${shops}`}</div>`;
    }

    // ---------- desk, wedding slideshow and victory screen ----------
    function mount(){
      const doc=api.document;
      if(!doc||mounted)return;
      mounted=true;
      if(doc.createElement&&!doc.getElementById('marriage-style')?.textContent){
        const style=doc.createElement('style');
        style.id='marriage-style';style.textContent=STYLE;
        (doc.head||doc.body).appendChild(style);
      }
      deskRing=api.$('desk-ring');
      // preview.html already holds both overlays; create them only if a page lacks them.
      show=doc.getElementById('marriage-show');
      if(!show){
        show=doc.createElement('div');show.id='marriage-show';show.className='marriage-show';
        api.$('stage').appendChild(show);
      }
      show.setAttribute('role','img');
      show.innerHTML='<img alt=""><img alt="">';
      showImages=show.querySelectorAll?[...show.querySelectorAll('img')]:[];
      if(showImages.length<2)showImages=[show.querySelector('img:first-child'),show.querySelector('img:last-child')];
      if(show.addEventListener)show.addEventListener('click',()=>{if(showing)advance();});
      win=doc.getElementById('marriage-win');
      if(!win){
        win=doc.createElement('div');win.id='marriage-win';win.className='marriage-win';
        api.$('stage').appendChild(win);
      }
      win.setAttribute('role','dialog');win.setAttribute('aria-live','polite');
      if(win.addEventListener)win.addEventListener('click',event=>{
        const control=event.target.closest&&event.target.closest('[data-marriage-win]');
        if(!control)return;
        if(control.dataset.marriageWin==='new')api.startNewRun();
        else hideVictory();
      });
    }
    function weddingFrames(id){
      if(!sister(id))return (data.thunderbirds?.scenes||[]).map(scene=>fill(scene.path,{slug:api.profile?.(id)?.slug||id}));
      const slug=sister(id).slug;
      return data.art.weddingScenes.map(scene=>`assets/marriage/weddings/${slug}-${scene.key}.png`);
    }
    // A Sister without her own wedding pictures yet: the slideshow falls back to her own
    // photographs. Once her pictures are saved at the usual paths they are used instead.
    function fallbackFrame(id,index){
      if(data?.sisters?.[id])return null;
      const gallery=api.profile?.(id)?.gallery||[];
      return gallery.length?gallery[index%gallery.length]:null;
    }
    function setFrame(img,id,index,src){
      const fallback=fallbackFrame(id,index);
      img.onerror=fallback?()=>{img.onerror=null;img.src=api.assetUrl(fallback);}:null;
      img.src=api.assetUrl(src);
    }
    function refreshDesk(){
      mount();
      const st=state();
      if(deskRing&&deskRing.classList)deskRing.classList.toggle('visible',!!(st&&st.ring&&!wed(st)));
    }
    function clearTimers(){for(const timer of slideTimers)api.cancel(timer);slideTimers=[];}
    // A full-screen montage: one picture at a time, slow cross-fades, no text or controls.
    function playWedding(id,preview){
      mount();clearTimers();hideVictory();
      api.setLowered(true);
      const frames=weddingFrames(id);
      showing={id,preview,frames,index:-1};
      show.setAttribute('aria-label',`Wedding photographs of ${brideName(id)}`);
      show.classList.add('visible');
      api.playUiSound(520);
      advance();
    }
    function advance(){
      if(!showing)return;
      clearTimers();
      showing.index++;
      if(showing.index>=showing.frames.length){finishWedding();return;}
      const img=showImages[showing.index%2],other=showImages[(showing.index+1)%2];
      setFrame(img,showing.id,showing.index,showing.frames[showing.index]);
      img.alt=((sister(showing.id)?data.art.weddingScenes:data.thunderbirds?.scenes)||[])[showing.index]?.title||'';
      img.classList.remove('on');void img.offsetWidth;img.classList.add('on');
      other.classList.remove('on');
      slideTimers.push(api.later(advance,SLIDE_MS));
    }
    function finishWedding(){
      const {id,preview}=showing;
      showing=null;clearTimers();
      show.classList.remove('visible');
      showVictory(id,preview);
    }
    function showVictory(id,preview){
      mount();
      const st=state(),tb=!sister(id),v=tb?data.thunderbirds.victory:data.victory;
      const day=preview?today():(st?.married||st?.tb)?.day;
      const backdrop=tb?data.thunderbirds.backdrop:data.art.victoryBackdrop;
      const frames=weddingFrames(id);
      win.innerHTML=`<img class="backdrop" src="${esc(api.assetUrl(backdrop))}" alt=""><div class="veil"></div><div class="card"><div class="frame"><img src="${esc(api.assetUrl(frames[3]))}" alt="${esc(brideName(id))} on her wedding day"></div><h2>${esc(v.title)}</h2><p class="sub">${esc(v.subtitle)}</p><p class="line">${esc(fill(v.line,{name:brideName(id),day}))}</p>${preview?'<p class="note">Testing preview. Your run is unchanged.</p><button data-marriage-win="close">Close preview</button>':`<button data-marriage-win="new">${esc(v.newGame)}</button>`}</div>`;
      const portrait=win.querySelector?.('.frame img');
      const fallback=fallbackFrame(id,3);
      if(portrait&&fallback)portrait.onerror=()=>{portrait.onerror=null;portrait.src=api.assetUrl(fallback);}; // her own photo until her wedding portrait exists
      const back=win.querySelector?.('.backdrop');
      if(back&&tb)back.onerror=()=>{back.onerror=null;back.src=api.assetUrl(data.art.victoryBackdrop);}; // the Sisters' backdrop until the Bluebirds' exists
      win.classList.add('visible');
      api.playUiSound(660);
    }
    function hideVictory(){if(win&&win.classList)win.classList.remove('visible');}

    // ---------- run lifecycle ----------
    function reset(){
      clearTimers();showing=null;mount();
      if(show&&show.classList)show.classList.remove('visible');
      hideVictory();refreshDesk();
    }
    function afterLoad(){
      clearTimers();showing=null;mount();
      if(show&&show.classList)show.classList.remove('visible');
      hideVictory();
      const world=api.world();
      if(!data||!world)return;
      world.marriage=normalize(world.marriage);
      const st=state();
      // The victory record and the marriage always agree.
      if(st.married)world.victory={type:'marriage',bride:st.married.id,day:st.married.day};
      else if(st.tb)world.victory={type:'thunderbirds',bride:st.tb.id,day:st.tb.day};
      else if(world.victory)delete world.victory;
      refreshDesk();
      if(wed(st))showVictory(wed(st).id,false);
    }
    // Testing menu: play a Sister's wedding and the victory screen without changing the run.
    let previewIndex=0;
    function previewWedding(id){
      if(!data)return false;
      const bride=sister(id)||api.profile?.(id)?.factionId==='thunderbirds'?id:SISTERS[previewIndex++%SISTERS.length]; // a Bluebird id previews her Bluebird wedding
      playWedding(bride,true);
      return bride;
    }

    mount();
    return {
      optionsFor,choose,notesEntry,jewellerContacts,jewellerName,contactForNumber,serviceTopics,chooseServiceTopic,
      reset,afterLoad,refreshDesk,previewWedding,thunderbirdWedding,
      hasData:()=>!!data,
      // The five jewellers as Hinge cards (preview.html puts them in the swipe deck).
      jewellerCards:()=>!data?[]:JEWELLERS.map(id=>({id,name:data.jewellers[id].name,shop:data.jewellers[id].shop,role:data.jewellers[id].role,portrait:data.jewellers[id].portrait})),
      // You matched with her and asked for her number: her shop line goes in your Contacts.
      meetJeweller:id=>{
        const st=state();
        if(!st||!JEWELLERS.includes(id))return null;
        ensureNumbers(st);
        st.jewellers[id].met=true;
        api.save();
        return st.numbers[id];
      },
      // A Sister who rings you may ask one of today's two examination questions over the phone.
      // It counts like one asked in the chat. Returns null if her examination hasn't started,
      // is passed, or today's questions are used up.
      phoneExam:id=>{
        const st=state();
        if(!st||wed(st)||!sister(id))return null;
        const s=sisterState(st,id);
        if(!s.started||s.passed||!canAsk(s))return null;
        const q=s.current!==null?question(s.current):draw(st,id);
        s.active=false; // the phone has the question now; the chat waits
        return {id:q.id,question:q.question,answers:[...q.answers]};
      },
      phoneAnswer:(id,index)=>{
        const st=state();
        if(!st||!sister(id))return null;
        const s=sisterState(st,id);
        if(s.current===null||!(index>=0&&index<4))return null;
        const q=question(s.current),correct=index===q.correctAnswerIndex,sis=sister(id);
        countAnswer(s);
        let passed=false;
        if(correct){
          s.streak++;s.best=Math.max(s.best,s.streak);
          if(s.streak>=data.rules.streakToPass){passed=true;s.passed=true;s.asked=[];s.streak=0;api.status(`${sis.name} says you passed. You may now propose to her.`);}
        }else{s.streak=0;s.asked=[];s.attempts++;}
        s.current=null;s.active=false;
        api.save();
        return {correct,passed,streak:s.streak,answer:q.answers[q.correctAnswerIndex],pass:passed?sis.pass:null};
      },
      // A Sister may ring and test you over the phone: one of the examination questions, chosen
      // by a key so it is the same on reload. Phone answers don't count towards her examination.
      phoneQuestion:(key,exclude=[])=>{
        const pool=(data?.questions||[]).filter(q=>!exclude.includes(q.id));
        if(!pool.length)return null;
        const q=pool[Math.floor(seeded(`${api.world().seed||'match'}:phone:${key}`)()*pool.length)];
        return {id:q.id,question:q.question,answers:[...q.answers],correctAnswerIndex:q.correctAnswerIndex};
      },
      isWon:()=>!!(state()?.married||state()?.tb),
      // Read-only helpers for tests and debugging.
      state:()=>state(),frames:id=>weddingFrames(id),
      slideshow:()=>({visible:!!show?.classList?.contains('visible'),image:showing?showImages[showing.index%2]?.src:'',index:showing?showing.index:-1}),
      victory:()=>({visible:!!win?.classList?.contains('visible'),html:win?.innerHTML||''})
    };
  }

  const engine={create,ids:{SISTERS,JEWELLERS}};
  root.MATCH_MARRIAGE_ENGINE=engine;
  if(typeof module!=='undefined'&&module.exports)module.exports=engine;
})(typeof window!=='undefined'?window:globalThis);

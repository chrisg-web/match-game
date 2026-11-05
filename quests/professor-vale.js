/*
 * MATCH quest: "The Professor Who Won't Disappear"   (file: quests/professor-vale.js)
 *
 * The player never leaves their bedroom. Everything happens through the phone:
 *   - Hinge chats   (topics depend on her faction; some named women have their own lines)
 *   - Phone calls   (University Office, newsroom and police lines that already exist,
 *                    plus numbers discovered during the quest, listed in Contacts)
 *   - Voicemails    (people ring back with news, in the Calls app's Voicemail tab)
 *   - The newspaper (the existing Vale stories, plus stories and classifieds this quest prints)
 *   - The room      (parcels on the doorstep, the desk where the device is built,
 *                    and the bedroom sequences for arrests and deaths)
 *
 * Two ways through:
 *   PROTECT   Piece together when and where the Back Row will strike. Then tip off
 *             Detective Graves (Police) and/or warn the Bluebirds, who adore Vale.
 *             Best ending: Graves rings you back and you tell her it was you; or Alice
 *             Beaumont invites you to the gala ball; or ask any Police or Bluebird
 *             match on a date. They all say yes now. The Bluebird endings are a win:
 *             they vote you in and marry you off (host.bride picks her, host.win plays it).
 *   BACK ROW  Ring Vanessa Greer back and join. Order Semtex, wire and a phone to your
 *             door, assemble it at your desk, leave it on the doorstep for Allison to
 *             collect, then dial the number on Day A. Best ending: Vanessa sides with you.
 *
 * Fiction only. Professor Adrian Vale resembles no real person. The device is shown at
 * story level: three delivered items, a symbol-matching note and a steady-hands check.
 * No real-world method is described anywhere.
 *
 * Time rule: simulated days only ("Day 5"). No weekdays, dates or clock times.
 * State lives at world.professorVale, so it is saved and loaded with the world.
 */
(function (root) {
  'use strict';

  // ================================================================ DATA ====
  const DATA = {
    id: 'professor_vale',
    storylineId: 'progressives_professor_attempts',
    title: 'The Professor Who Won’t Disappear',
    version: 2,
    autoOpenDay: 3,     // the case opens by itself on this day if the player never reads a Vale story
    debateGap: 4,       // Vale's Founders' Hall debate is this many days after the case opens
    quietDaysToWin: 3,  // Back Row: days to stay free after the blast before Vanessa rings

    thresholds: {
      exposureWarn: 60, exposureDeath: 100, silencedExposure: 60, exposureDecay: 5,
      heatWarn: 60, heatArrestAtHandover: 70, heatArrestAfter: 80,
      rosaWarn: 50, rosaBreaks: 80, rosaDaily: 6, rosaDailyAfter: 8, rosaAtBlast: 15, rosaCalm: 25,
      rosaVanessa: 50, rosaPlan: 75, pressDiscount: 25
    },

    // Every image the quest uses. placeholder:true = make a labelled stand-in until the art exists.
    assets: [
      { path: 'assets/quests/professor/vale.png', placeholder: false, use: 'Portrait: Professor Adrian Vale. Distinguished middle-aged academic, greying hair, traditional tweed jacket, university tie, intelligent and slightly amused expression, a little eccentric but respectable. Invented; resembles no real person. If a Vale design already exists, match it exactly.' },
      { path: 'assets/quests/professor/graves-line.png', placeholder: false, use: 'Call portrait: Detective Eleanor Graves’s direct line (her existing Hinge photo style, at a desk with a phone).' },
      { path: 'assets/quests/professor/unknown-caller.png', placeholder: false, use: 'Call portrait: silhouette for unknown numbers (Rosa, Vanessa, Allison).' },
      { path: 'assets/quests/professor/alice-line.png', placeholder: false, use: 'Call portrait: Alice Beaumont (her existing Hinge photo style), blue ribbon brooch.' },
      { path: 'assets/quests/professor/lenny.png', placeholder: false, use: 'Call portrait: a garden shed with the door half open. Lenny is never seen.' },
      { path: 'assets/quests/professor/hendry.png', placeholder: false, use: 'Call portrait: Hendry’s Hardware shopfront sign.' },
      { path: 'assets/quests/professor/phones.png', placeholder: false, use: 'Call portrait: a small phone-shop sign, PHONES – unlocked – delivered.' },
      { path: 'assets/quests/professor/item-semtex.png', placeholder: false, use: 'Desk item: a plain block wrapped in brown tape inside a garden-center bag. No labels, no detail.' },
      { path: 'assets/quests/professor/item-wire.png', placeholder: false, use: 'Desk item: a reel of ordinary household wire.' },
      { path: 'assets/quests/professor/item-phone.png', placeholder: false, use: 'Desk item: a cheap early-2000s pay-as-you-go phone with a number on masking tape.' },
      { path: 'assets/quests/professor/workbench.png', placeholder: false, use: 'The player’s bedroom desk cleared, lamp on, curtains shut. Same art style and room as the bedroom scenes.' },
      { path: 'assets/quests/professor/vanessa-note.png', placeholder: false, use: 'Vanessa’s folded note: three hand-drawn symbols (◇ ○ □) in a row. Symbols only, no instructions.' },
      { path: 'assets/quests/professor/ending-graves.png', placeholder: false, use: 'Best ending: Detective Eleanor Graves at a restaurant table, off duty, finally smiling.' },
      { path: 'assets/quests/professor/ending-thunderbirds.png', placeholder: false, use: 'Best ending: the Bluebird gala top table, blue ribbons, Vale sulking in the background.' },
      { path: 'assets/quests/professor/ending-vanessa.png', placeholder: false, use: 'Best ending: Vanessa Greer in her candlelit apartment, two glasses, books everywhere.' },
      { path: 'assets/newspapers/professor_car_blast.png', placeholder: false, use: 'Newspaper art: police tape across a faculty parking lot and a scorched empty bay. Nobody visible.' },
      { path: 'assets/newspapers/professor_device_found.png', placeholder: false, use: 'Newspaper art: a dented estate car with police markers beside it.' },
      { path: 'assets/newspapers/classifieds.png', placeholder: false, use: 'Newspaper art: a page of tiny classified adverts with three circled in pen.' },
      { path: 'assets/newspapers/professor_memorial.png', placeholder: false, use: 'Newspaper art: candles and flowers outside a campus building.' },
      { path: 'assets/newspapers/professor_campus.png', placeholder: false, use: 'Existing newspaper art (campus protests)' },
      { path: 'assets/newspapers/professor_fire.png', placeholder: false, use: 'Existing newspaper art (house fire)' },
      { path: 'assets/newspapers/police_interview.png', placeholder: false, use: 'Existing newspaper art (questioning)' },
      { path: 'assets/newspapers/police_station.png', placeholder: false, use: 'Existing newspaper art (arrests)' },
      { path: 'assets/newspapers/police_evidence.png', placeholder: false, use: 'Existing newspaper art (investigation)' },
      { path: 'assets/newspapers/police_roadblock.png', placeholder: false, use: 'Existing newspaper art (inquiry)' }
    ],

    // role = the truth, shown once learned. blurb = what anyone can see. profileId = existing Hinge profile.
    cast: {
      vale: { name: 'Professor Adrian Vale', role: 'Invented right-wing academic: charismatic, clever, sometimes arrogant. A great admirer of Camille Paglia, Michel Houellebecq, Nathan Cofnas, Bret Easton Ellis and Adam Curtis, and he keeps inviting them to campus. The Progressives loathe him for it. Adored by the Bluebirds, respected by the police.' },
      vanessa: { name: 'Vanessa Greer', profileId: 'MATCH-052', faction: 'progressives', role: 'Political activist. Runs the Back Row. Charming, certain, dangerous.', blurb: 'Political activist. Magnetic. Everyone on campus has an opinion about her.' },
      allison: { name: 'Allison Kent', profileId: 'MATCH-053', faction: 'progressives', role: 'Vale’s research assistant. Keeps his diary. Quietly in the Back Row.', blurb: 'Vale’s research assistant. Quiet. Organized.' },
      rosa: { name: 'Rosa Gutierrez', profileId: 'MATCH-054', faction: 'progressives', role: 'Graduate student. Sits with the Back Row and hates what it has become.', blurb: 'Graduate student. Sits at the back of Vale’s lectures.' },
      rebecca: { name: 'Rebecca Shaw', profileId: 'MATCH-008', faction: 'progressives', role: 'Organizes the peaceful protests. Innocent.', blurb: 'Student organizer. Her name is on every protest flyer.' },
      jennifer: { name: 'Jennifer Tate', profileId: 'MATCH-051', faction: 'progressives', role: 'Campus organizer. Loud, theatrical and innocent.', blurb: 'Campus organizer. Loud, theatrical, owns a megaphone.' },
      alice: { name: 'Alice Beaumont', profileId: 'MATCH-042', faction: 'thunderbirds', role: 'Bluebird event chair. Booked Vale for the gala. The one person he listens to.' },
      graves: { name: 'Detective Eleanor Graves', profileId: 'MATCH-002', faction: 'police', role: 'Detective. Has read every Vale accident report and believes none of them.' },
      pemberton: { name: 'Dr. Hal Pemberton', role: 'Vale’s colleague. Has never owned a working car. Borrows Vale’s.' }
    },
    cell: ['vanessa', 'allison'],

    facts: {
      car_story: 'Paper: Vale’s brakes failed the day after he hosted Camille Paglia on campus.',
      fire_story: 'Paper: a fire at Vale’s house, the day after his evening with Michel Houellebecq.',
      rule: 'Pattern: each accident came the day after one of Vale’s invited speakers came to campus.',
      debate: 'Vale’s next guest: Nathan Cofnas, at Founders’ Hall on Day {T}.',
      back_row: 'A clique called the Back Row sits behind the protests against Vale’s speakers and calls them a hobby.',
      jennifer: 'Jennifer Tate organized the loud protests against Vale’s speakers. Very public. Very obvious.',
      jennifer_clear: 'People who know Jennifer swear she’s all noise. She once held a funeral for a pigeon.',
      vanessa: 'Vanessa Greer runs the Back Row.',
      diary_leak: 'The newsroom thinks someone in Vale’s own department is leaking his diary.',
      allison: 'Allison Kent, Vale’s research assistant, keeps his diary.',
      car_bay: 'The day after anything public, Vale leaves his car in the faculty parking lot, bay fourteen.',
      car_plan: 'The plan: Vale’s car, faculty parking lot, bay fourteen, on Day {A}, the day after the Cofnas lecture.',
      codeword: 'Vanessa’s code word for the Semtex: ring Lenny on the garden-shed number and ask for a garden shed clearance. Never say Semtex on the phone.'
    },
    deduction: { needs: ['rule', 'debate', 'allison', 'car_bay'], text: 'You put it together: the day after the Cofnas lecture, his car, bay fourteen, and Allison Kent knows exactly where he’ll be. Day {A}.' },
    // When the case has stalled for days, Rosa rings and gives you the next piece (Chris, 4 November 2026).
    help: {
      caller: 'Rosa Gutierrez',
      open: 'It’s Rosa. Rosa Gutierrez. I sit at the back of Professor Vale’s lectures. I heard you’ve been asking about him. Can I tell you something? Not on Hinge. Like this.',
      tell: 'Tell me',
      later: 'Not now',
      debate: 'Vale has Nathan Cofnas speaking at Founders’ Hall on Day {T}. Every time one of his speakers comes to campus, something happens to Vale the next day. Save this number. It’s mine.',
      back_row: 'It isn’t Jennifer Tate and the protesters. They’re loud and they’re harmless. The ones you want sit at the back of his lectures and call the protests a hobby. They call themselves the Back Row.',
      vanessa: 'Vanessa Greer. She runs the Back Row. Everyone does what she says. Be careful who you ask about her.',
      rule: 'Read the Sunfall Daily again. His brakes went the day after Paglia. His house burned the day after Houellebecq. It’s always the day after.',
      car_plan: 'They’re going to do his car. Faculty parking lot, bay fourteen, on Day {A}, the day after the Cofnas lecture. I can’t go to the police. You can.',
      graves: 'You know everything I know. Detective Eleanor Graves is the one who listens. Ring her before Day {A} and give her Vanessa’s name and the plan. Here’s her direct line.',
      later_reply: 'Okay. You have my number now. Please don’t wait too long.'
    },
    hints: {
      rule: 'Read the Sunfall Daily’s Vale stories, or ask the newsroom whether they’re connected.',
      debate: 'Who is Vale inviting next, and when? Ring the University Office, or ask a Progressive match.',
      back_row: 'Ask a Progressive match about the protests, or ask the newsroom about campus groups.',
      vanessa: 'Who runs the Back Row? Ask a Progressive match, or wait for someone to call you.',
      car_plan: 'What exactly, and where? Rosa knows. Or piece it together: his diary, his car, the day after the Cofnas lecture.',
      stop: 'Stop it before Day {A}: give Detective Graves a name and the plan, or warn a Bluebird match.'
    },

    lines: {
      opened: 'Something about Professor Vale’s accidents doesn’t add up. A case file is in your bedside cupboard.',
      autoOpened: 'The Sunfall Daily has run two Professor Vale accidents in a row. A case file is in your bedside cupboard.',
      newsLearned: { car: 'Noted: the brakes failed the day after Camille Paglia’s lecture.', fire: 'Noted: the fire came the day after the Houellebecq evening.', debate: 'Noted: Nathan Cofnas speaks at Founders’ Hall on Day {T}.' },
      ruleLearned: 'Two accidents, each the day after one of Vale’s guests came to campus. That isn’t luck.',
      unavailable: 'That isn’t possible right now.',
      over: 'This case is closed.',
      exposureWarn: 'Your questions are getting around campus. Ask fewer for a day or two before the Back Row decides you’re a problem.',
      heatWarn: 'A patrol car has driven down your road twice today.',
      voicemail: 'New voicemail. Check the Voicemail tab in Calls.',
      walkAway: 'You close the case file. Whatever happens to Professor Vale now, it happens without you.',
      wireFriend: '{name} will drop a reel of wire round tomorrow. No receipt, no questions.',
      assembleStart: 'You clear your desk, shut the curtains, lay the three things out and unfold Vanessa’s note.',
      assembleOk: 'It takes the whole evening. When it’s done it looks like nothing much: a phone, some wire, a block wrapped in tape, back in the garden-center bag. That’s the worst part.',
      assembleWrong: 'Nothing. It’s dead. You’ve got Vanessa’s note wrong somewhere. You take it all apart again, very slowly. Try again another day.',
      assembleShaky: 'Your hands are shaking too much. You put everything down and sit on your hands until they stop. Try again another day.',
      assembleBoom: 'Something on the desk goes wrong all at once.',
      assembleRested: 'You’ve already tried today. Your hands need a rest.',
      deviceOnDesk: 'Don’t ring the number on the masking tape while the device is still at your house.',
      quietDay: 'Another day without a knock at the door.',
      wrongManNextDay: 'Vanessa won’t answer. Nobody from the Back Row will.',
      classifiedsRead: 'You copy the three circled numbers into your Contacts.'
    },

    // Things that appear in, or leave, the player's room overnight. Shown as a caption over the bedroom.
    room: {
      semtex: 'There’s a parcel just inside your door, heavier than it looks, wrapped in a garden-center bag. Lenny doesn’t do receipts.',
      wire: 'A small box from Hendry’s Hardware, just inside your door: one reel of wire, and a leaflet about their spring offers.',
      wireGift: 'A carrier bag from {name}, just inside your door: one reel of wire, and a note saying you owe her a drink.',
      phone: 'A cheap phone has come through your letterbox, still in its blister pack, with a number written on masking tape.',
      collected: 'The garden-center bag has gone from your doorstep. In its place: a note in Allison Kent’s neat handwriting. Day {A}. Wait for my text.'
    },

    voicemails: {
      rosa: { from: 'rosa', text: 'It’s Rosa. Rosa Gutierrez. You’ve been asking about the Back Row. I can’t text about it. Call me back on this number. Please don’t tell anyone it was me.' },
      vanessa: { from: 'vanessa', text: 'This is Vanessa Greer. You keep asking about Vale. So do we. Call me back. Don’t text.' },
      gravesArrest: { from: 'graves', text: 'Detective Graves. We had people at bay fourteen on Day {A}, and we got them with it in their hands. Somebody gave us a name and a day. Call me back on this line.' },
      alice: { from: 'alice', text: 'Alice Beaumont. Adrian is alive, sulking, and staying in our guest room. Somebody warned us, and I know it was you. The Bluebirds would like you as guest of honor at the gala ball. Do call.' },
      vanessaInvite: { from: 'vanessa', text: 'It’s Vanessa. Days now, and nobody has knocked on your door. You did what three of us couldn’t. Call me.' },
      rosaPanic: { from: 'rosa', text: 'It’s Rosa. I can’t sleep. I keep thinking about walking into the police station. Please call me.' },
      valeBrick: { from: 'vale', text: '' },
      fakeGraves: { from: 'fake', text: '' },
      valeVm1: { from: 'vale', text: 'Adrian Vale. Lorraine in the office says someone keeps asking about my car. If that’s you, ring me back on this number. I’m curious. I’m always curious.' },
      valeVm2: { from: 'vale', text: 'Adrian again. They threw eggs. Organic. Tomorrow I read the complaints in my car, the way I always do. Ring me if you’re still worried. You won’t. Nobody does.' },
      valeThanks: { from: 'vale', text: 'Adrian Vale. My car went up in bay fourteen with nobody in it. I took a cab, like you said. I don’t know how you knew and I don’t think I want to. Thank you. Don’t tell the faculty. They’ll be so disappointed.' }
    },

    // ----- Hinge chat topics, keyed by the woman's factionId. `as` overrides a topic for one named
    // profile. learn: facts · exposure: the Back Row noticing you · flag / effect: handled by the engine.
    hinge: {
      progressives: [
        { id: 'pv_protests', label: 'Ask about the protests against Vale’s guest speakers', stage: ['open'],
          player: 'Are you protesting Vale’s speakers? Someone said his accidents weren’t accidents.',
          reply: 'First Paglia, then Houellebecq, and now he’s bringing Nathan Cofnas to Founders’ Hall on Day {T}. We protest because those people shouldn’t get a university stage, not because we want anyone hurt. The brakes and the fire weren’t us. There’s a lot at the back of his lectures, the Back Row, who call our protests a hobby.',
          learn: ['back_row', 'debate'],
          as: {
            'MATCH-051': { reply: 'YES, I organized them! Paglia, Houellebecq, and now Cofnas at Founders’ Hall on Day {T}? We will be LOUD. Peaceful! With banners! I’d never hurt anyone, I just want Vale to stop inviting them. Do you want a banner? I have spare banners.', learn: ['jennifer', 'debate'] },
            'MATCH-052': { reply: 'Petitions didn’t stop Paglia. Placards didn’t stop Houellebecq. They won’t stop Cofnas. A long pause. You keep asking about Vale. So do I. I’ll call you.', learn: ['back_row'], exposure: 10, effect: 'vanessaCalls' },
            'MATCH-053': { reply: 'I work for him. Research assistant. I keep his diary and I type up his speaker invitations. Every single one. Her next message takes a long time to arrive. Somebody has to.', learn: ['allison'], exposure: 10 },
            'MATCH-054': { reply: 'I sit at the back of his lectures. That’s all. Then, a minute later: Not over text. I’ll call you.', learn: ['back_row'], effect: 'rosaCalls' }
          } },
        { id: 'pv_backrow', label: 'Ask who runs the Back Row', stage: ['open'], needs: ['back_row'], until: ['vanessa'],
          player: 'Who actually runs the Back Row?',
          reply: 'Vanessa Greer. Everyone knows and nobody says. Delete this chat.', learn: ['vanessa'], exposure: 10,
          as: {
            'MATCH-052': { reply: 'You’re talking to her. Expect a call.', learn: ['vanessa'], exposure: 10, effect: 'vanessaCalls' },
            'MATCH-053': { reply: 'Never heard of it. She doesn’t reply to anything after that.', learn: [], exposure: 15 },
            'MATCH-054': { reply: 'Please. Not here. I’ll call you.', learn: [], exposure: 0, effect: 'rosaCalls' },
            'MATCH-051': { reply: 'Ugh. Vanessa Greer’s lot. They think chanting is beneath them. They’re the ones you should be asking about, not me.', learn: ['vanessa'], exposure: 5 }
          } },
        { id: 'pv_jen', label: 'Ask whether Jennifer Tate could be behind it', stage: ['open'], needs: ['jennifer'], until: ['jennifer_clear'],
          player: 'Could Jennifer Tate be behind what’s happening to Vale?',
          reply: 'Jen? Jen is all megaphone. She held a funeral for a pigeon. Look at the people who never come to the protests, the ones who say the Cofnas invitation is the last one he gets.', learn: ['jennifer_clear'],
          as: { 'MATCH-051': { reply: 'ME? I held a FUNERAL for a PIGEON.' } } }
      ],
      police: [
        { id: 'pv_police', label: 'Ask whether the police believe Vale’s accidents', stage: ['open', 'resolved'],
          player: 'Does anyone at the station think Professor Vale’s accidents were accidents?',
          reply: 'Detective Eleanor Graves doesn’t. If you know something real, ring the station and ask for her. She wants a name and a day, not a theory.', flag: 'gravesKnown',
          as: { 'MATCH-002': { reply: 'I don’t. If you ever know something real, I want a name and a day. Here’s my direct line.', effect: 'gravesLine' } } }
      ],
      fourth_estate: [
        { id: 'pv_press', label: 'Ask what the paper knows about Professor Vale', stage: ['open', 'resolved'],
          player: 'What does the paper actually know about Professor Vale’s accidents?',
          reply: 'Off the record? The brakes went the day after Paglia, the fire the day after Houellebecq, and Cofnas is next. Our reporter thinks someone in his own department is leaking his diary.', learn: ['rule', 'diary_leak'] }
      ],
      thunderbirds: [
        { id: 'pv_tb_vale', label: 'Ask about Professor Vale', stage: ['open', 'resolved'],
          player: 'Do the Bluebirds know Professor Vale?',
          reply: 'Adrian? We adore him. He brings the most marvelous speakers, and the students throw tantrums. He’s speaking at our next gala. Alice Beaumont looks after him. If anything ever worries you about him, tell me and I’ll tell Alice.', flag: 'tbLinked',
          as: { 'MATCH-042': { reply: 'Adrian? He’s a dear. Paglia, Houellebecq, Cofnas: he invites everyone the students are frightened of, and I adore him for it. I booked him for our gala. If anything ever worries you about him, you tell me.' } } },
        { id: 'pv_tb_warn', label: 'Warn her that Vale is in danger the day after the Cofnas lecture', stage: ['open'], needs: ['debate'], needsAny: ['fact:rule', 'fact:car_plan'], needsFlag: 'tbLinked', effect: 'warnThunderbirds',
          player: 'Every accident has come the day after one of his guests spoke. Cofnas is on Day {T}. Keep Vale away from his car the day after.',
          reply: 'The day after each guest… yes, I see it. I’m ringing Alice now. He’ll stay with the Beaumonts and his car stays exactly where it is. He’ll sulk. Let him.',
          replyPlan: 'His car. Of course it’s his car. Right. I’m ringing Alice now. After the Cofnas lecture he stays with the Beaumonts, and nobody touches that car. He’ll hate it. Good.' }
      ],
      goth_girls: [
        { id: 'pv_rumour', label: 'Ask if she’s heard about Professor Vale', stage: ['open'],
          player: 'Have you heard what keeps happening to Professor Vale?',
          reply: 'Ask Jennifer Tate, the girl with the megaphone. Or don’t. Honestly, Houellebecq was the best night campus has had in years. It’s the quiet ones at the back you should worry about.', learn: ['jennifer'] }
      ],
      sisters_of_mercy: [
        { id: 'pv_rumour', label: 'Ask if she’s heard about Professor Vale', stage: ['open'],
          player: 'Have you heard what keeps happening to Professor Vale?',
          reply: 'We pray for him. We pray for the people who hate him too. They need it more.' }
      ],
      normie_girls: [
        { id: 'pv_rumour', label: 'Ask if she’s heard about Professor Vale', stage: ['open'],
          player: 'Have you heard what keeps happening to Professor Vale?',
          reply: 'Isn’t he the one who keeps nearly dying? My cousin says it’s a curse.' }
      ]
    },

    // ----- Phone lines. 'service:*' lines already exist in the game; 'pv:*' are quest numbers.
    contacts: {
      graves: { name: 'Detective Graves (direct line)', portrait: 'assets/quests/professor/graves-line.png', greeting: 'Graves.' },
      rosa: { name: 'Rosa Gutierrez', portrait: 'assets/quests/professor/unknown-caller.png', greeting: 'Hello? …Is this you? Okay. Okay.' },
      vanessa: { name: 'Vanessa Greer', portrait: 'assets/quests/professor/unknown-caller.png', greeting: 'Vanessa.' },
      allison: { name: 'Allison Kent', portrait: 'assets/quests/professor/unknown-caller.png', greeting: 'Allison. Be brief.' },
      lenny: { name: 'Garden Shed Clearance (Lenny)', portrait: 'assets/quests/professor/lenny.png', greeting: 'Yeah?' },
      hendry: { name: 'Hendry’s Hardware', portrait: 'assets/quests/professor/hendry.png', greeting: 'Hendry’s Hardware, we deliver! How can I help?' },
      phones: { name: 'Phones – Unlocked – Delivered', portrait: 'assets/quests/professor/phones.png', greeting: 'Phones. What do you want?' },
      device: { name: 'The number on the masking tape', portrait: 'assets/quests/professor/item-phone.png', greeting: 'It’s ringing.' },
      alice: { name: 'Alice Beaumont', portrait: 'assets/quests/professor/alice-line.png', greeting: 'Alice Beaumont. Oh, it’s you. Darling.' },
      vale: { name: 'Professor Adrian Vale', portrait: 'assets/quests/professor/vale.png', greeting: 'Vale. Who is this? Ah. You.' },
      fake: { name: 'Detective Graves (mobile)', portrait: 'assets/quests/professor/unknown-caller.png', greeting: 'The number you have dialed is not in service.' }
    },

    // ----- Vale himself (Chris, 2 November 2026: he should be a person, not a portrait). He rings you
    // once someone tells him you've been asking, and again on the night of the lecture. What you say
    // decides whether he goes near his car. Taking a cab saves him, unless Pemberton borrows it.
    vale: {
      name: 'Adrian Vale', portrait: 'assets/quests/professor/vale.png',
      call1: {
        open: 'Is this the person who keeps ringing my department? Adrian Vale. Lorraine in the office says you ask about my car the way other people ask about the weather. I’m flattered. Nobody has worried about me since my mother. What do you want?',
        choices: { warn: 'Tell him someone wants him dead', fan: 'Tell him you admire his nerve', ask: 'Ask who he’s bringing next', hang: 'Hang up' },
        warn: 'Dead? My dear, half the faculty wants me dead. They’ve been trying for years, by committee. The brakes were old and the wiring in that house was older. Come and watch me not die at Founders’ Hall on Day {T}. Nathan Cofnas. Bring your fears, he’ll enjoy them.',
        fan: 'Nerve! Nobody says nerve anymore, they say harm. Thank you. Nathan Cofnas, Founders’ Hall, Day {T}. My assistant, Allison, sends out the invitations. She’ll put you on the list. She’s been terribly quiet lately. I think she disapproves of me. Everyone sensible does.',
        ask: 'Nathan Cofnas. Founders’ Hall, Day {T}. The petition against him has more signatures than his book has readers. I’ve read both. Come, if you can bear daylight.'
      },
      call2: {
        known: 'It’s Adrian. They threw eggs. Organic eggs, which I think was the protest. Cofnas was magnificent and nobody listened. Tomorrow I go in early and read the complaints in my car, the way I always do. You sounded worried last time. Are you still worried?',
        stranger: 'You don’t know me. Adrian Vale. Lorraine gave me this number and said you’d been worried about me. Tonight they threw eggs. Tomorrow I read the complaints in my car, the way I always do. Is there something you want to tell me?',
        choices: { car: 'Tell him not to go near his car tomorrow', stay: 'Tell him to spend the night with the Bluebirds', luck: 'Wish him luck', hang: 'Hang up' },
        carYes: 'Not my car. A long breath. Fine. I’ll take a cab and read the complaints in the back of it, and the driver will hate me too. You’ll owe me an explanation.',
        carNo: 'Not my car? You sound like my insurer. Goodnight, whoever you are.',
        stayYes: 'Alice has been begging me to stay at theirs since the fire. I’ll ring her now. If nothing happens, I’m blaming you at dinner.',
        stayNo: 'Hide with the Bluebirds? They’d make me wear a ribbon. Goodnight.',
        luck: 'Luck is for people without tenure. Goodnight.'
      },
      chat: 'Alive, against the odds and the faculty. I’m reading. Ring me when you have something interesting to say.',
      // A real conversation (Chris, 4 November 2026: he wasn't helpful at all). On his calls and when you ring him,
      // you can talk: Cofnas, his guests, the right, the students, Allison, philosophy. Talking builds his trust
      // (he listens to your warning about the car at 2), and some of what he says goes in your notebook.
      talk: {
        cofnas: { label: 'Ask him why he invited Nathan Cofnas', trust: 1, learn: ['debate'],
          text: 'Nathan is a philosopher who asks a question the university has decided may not be asked: how much of the difference between groups is inherited. A university that forbids a question has stopped being a university. If he is wrong, someone should stand up in Founders’ Hall and show him where. That is what a lecture is for. Instead they wrote a petition. You can’t refute a man with a petition. Founders’ Hall, Day {T}.' },
        agree: { label: 'Ask him if he agrees with Cofnas', after: 'cofnas', trust: 1,
          text: 'I agree the question should be asked, and that the answer should come from evidence, not from a vote. Where the evidence goes is not mine to decide, and it isn’t the students’ either. Here is what I believe: no average is a verdict on any one person. You meet people one at a time. So does Nathan, whatever his petitioners think.' },
        guests: { label: 'Ask him about his other guests', learn: ['car_story', 'fire_story', 'rule'],
          text: 'Camille Paglia, who told the faculty that sex is a war and they were all losing it. Michel Houellebecq, who said almost nothing for an hour and was magnificent. Funny, now you mention it. My brakes went the morning after Camille, and my kitchen caught fire the night after Michel. If I were superstitious I would cancel Nathan. I’m not. I teach Hume.' },
        right: { label: 'Ask him if he’s on the right', trust: 1,
          text: 'I’m a conservative in the old sense. Most things worth having are hard to build and easy to burn, and I would rather keep the cathedral than win the argument about it. The modern right? Half of it is angry men with microphones. The modern left is anxious people with tenure. I prefer the dead. They argue better, and they never sign petitions.' },
        students: { label: 'Ask him about the students who protest', learn: ['jennifer', 'jennifer_clear', 'back_row'],
          text: 'I like them more than they like me. Jennifer Tate shouts through a megaphone at every lecture. She once held a funeral for a pigeon. She couldn’t hurt a fly. The quiet ones worry me more. They sit at the back of my seminar and call themselves the Back Row. They don’t shout. They take notes.' },
        allison: { label: 'Ask him about his assistant', learn: ['allison'],
          text: 'Allison Kent, my research assistant. She keeps my diary, sends my invitations and knows where I am better than I do. She used to laugh at my jokes. Lately she has gone very quiet. I assume she disapproves of me. Everyone sensible does.' },
        routine: { label: 'Ask him what he does the morning after a lecture', needTrust: 2, learn: ['car_bay', 'allison'],
          text: 'You’ll laugh. The morning after anything public I go in early, park in the faculty lot, bay fourteen, and read the complaints in my car with a flask of coffee. It’s the only quiet place on campus. Allison says it’s my one predictable habit.' },
        afraid: { label: 'Ask him if he’s afraid',
          text: 'Afraid? Of students? I’m afraid of boredom and of my own cooking. Though I’ll admit the fire got my attention. I sleep with the window open now, which my doctor calls progress.' },
        why: { label: 'Ask him why he keeps doing it', trust: 1,
          text: 'Because somebody has to stand at the front of the room and say the thing out loud, so the students can find out whether it survives being said. Most of my colleagues decided long ago that their job is to keep the peace. Mine is to keep the questions.' },
        women: { label: 'Ask him for advice about women', trust: 1,
          text: 'Read Paglia. Then put the book down and listen to her. To whoever she is, I mean. Most men talk to win, and women can always tell. Ask her something you don’t know the answer to, and then be quiet long enough to hear it.' }
      },
      lessonLabel: 'Ask him to teach you something',
      talkLabel: 'Talk with him',
      talkOpen: 'Go on, then. I have a lecture to rewrite and all night not to do it. What do you want to know?',
      talkBack: 'Where were we?',
      lessons: [
        'Socrates said the unexamined life is not worth living. Athens put him to death by a democratic vote for corrupting the youth, which is to say for asking questions in public. Every university has a statue of him, and a committee that would vote the same way.',
        'John Stuart Mill: he who knows only his own side of the case knows little of that. If you can’t state your opponent’s view so well that he would sign it, you haven’t earned the right to disagree with him. Write it on your hand.',
        'Hume. You cannot get an ought from an is. The facts never tell you, on their own, what you should do about them. Remember that the next time someone tells you the science says how you are supposed to feel.',
        'Burke called society a partnership between the dead, the living and those not yet born. The living are the loudest partner and the least wise. That is the whole of conservatism, and it fits on a postcard.',
        'Nietzsche: whoever fights monsters should see to it that he does not become a monster. I think of that every time I read a petition against me. And every time I write a reply.',
        'Camille says nature is not our friend. Civilization is the long argument we have with it. Everything good, the cathedral, the sonnet, the vaccine, was built against nature, which is why it is so easy to knock down.',
        'Hannah Arendt watched a man on trial for helping murder millions and found him ordinary, a clerk who never thought about what he signed. Most harm is done by people who never asked a single question. Ask yours.'
      ],
      lessonsDone: 'That’s the syllabus. Read the books, and ring me when you disagree with one of them.'
    },

    // ----- The University Office has a person on the desk. Lorraine notices who keeps ringing about Vale,
    // so the case's suspicion shows in her voice (and in Word on campus in the case file), not a number.
    university: {
      greet: [
        'Founders’ Hall office, Lorraine speaking. How can I help?',
        'Founders’ Hall office. Oh. It’s you again. What is it this time?',
        'Founders’ Hall office. …Look. Professor Vale’s assistant was in here asking who keeps ringing about him. I gave her your number. I didn’t know what else to do. Make it quick.'
      ],
      word: [
        'Nobody on campus has noticed you yet.',
        'Lorraine at the University Office knows your voice now.',
        'Allison Kent has been asking who keeps calling about Vale. Lorraine gave her your number.'
      ]
    },

    // ----- More phone tricks (Chris, 2 November 2026): a crossed line, a fake detective, Graves asking how
    // you know, and a brick through Vale's window before the lecture.
    tricks: {
      crossed: { label: 'Ask to be put through to Professor Vale’s office',
        reply: 'Lorraine puts you through. Wrong extension. A woman’s voice, low and fast: …bay fourteen, the day after, he always does. Yes. I know. Then she hears you breathing, and the line goes dead.' },
      fake: {
        name: 'Detective Graves', open: 'Detective Graves. I hear you’ve been asking about Professor Vale. Tell me everything you know, and I mean everything. Who, where and when.',
        choices: { tell: 'Tell her everything you know', callback: 'Ask her to ring you back on the station line', hang: 'Hang up' },
        tell: 'Thank you. A pause. That’s very helpful. She hangs up without saying goodbye. Graves always says goodbye.',
        callback: 'A long pause. Then the line goes dead. Nobody rings back from the station.',
        clue: 'Somebody calling herself Detective Graves rang from a mobile number and asked what you know about Vale.',
        vm: 'Detective Graves. Ring me back on this number. It’s about Professor Vale. Don’t ring the station.'
      },
      how: {
        open: 'Graves writes it down. Then: Now tell me how you know all this.',
        choices: { paper: 'Tell her you pieced it together from the paper', friend: 'Tell her a friend told you', secret: 'Tell her you’d rather not say' },
        paper: 'The paper and his diary. You should be doing my job. Don’t.',
        friend: 'A friend. Fine. Your friend should be careful who else they tell.',
        secret: 'Have it your way. I’ll remember you didn’t say.'
      },
      brickVm: 'Adrian Vale. Someone put a brick through my study window. With a note. It said: Third time. The police say it’s a threat. I think it’s a pun. Ring me if you know something I don’t.'
    },

    // ----- The wiretap (Chris, 2 November 2026). Give Graves Vanessa’s name without the plan and she asks
    // you to ring Vanessa while she listens. Get Vanessa to say when and where without making her
    // suspicious. Too careful, too pushy or too strange, and she hangs up knowing.
    wiretap: {
      setup: '{name}? A name isn’t a case. Graves is quiet for a moment. Ring her. I’ll be on the line, and she won’t know. Get her to say when and where, in her own words. Then hang up and leave the rest to me.',
      open: 'Vanessa. …You never ring me. What do you want?',
      burnAt: 4,
      steps: [
        { choices: {
          calm: { label: 'Say you’ve been thinking about her offer', sus: 0, reply: 'Thinking. That’s a start. Most people just panic.' },
          bold: { label: 'Tell her you know what she’s planning', sus: 2, reply: 'Do you. That’s a funny thing to say on a phone.' },
          safe: { label: 'Ask her if this line is safe', sus: 3, reply: 'Is it? You tell me. A long pause.' } } },
        { choices: {
          when: { label: 'Ask when it would happen', sus: 1, got: 'day', reply: 'After the lecture. The day after. He always reads his complaints in the car. Don’t ask me again.' },
          what: { label: 'Ask what you’d have to do', sus: 0, reply: 'Nothing clever. You build something at your place and leave it on your step. Somebody collects. You make one call.' },
          flatter: { label: 'Tell her the brakes and the fire were brilliant', sus: 2, reply: 'Brilliant? They failed. Twice. Don’t flatter me. I can hear you smiling.' } } },
        { choices: {
          where: { label: 'Ask where he’ll be', sus: 1, got: 'place', reply: 'Bay fourteen. The faculty lot. Where he always is the day after he humiliates us.' },
          plain: { label: 'Ask her to say it plainly', sus: 3, reply: 'Plainly? Nobody says anything plainly on a phone. Who taught you to talk like that?' },
          soft: { label: 'Tell her you’re scared', sus: -1, reply: 'Good. Scared people are careful. Careful people are useful.' } } }
      ],
      win: 'Vanessa hangs up first. A second later, a click, and Graves’s voice, very close: That’s her, in her own words. Day {A}, bay fourteen. Go to bed. Don’t ring anyone.',
      partial: 'Vanessa hangs up. A click, then Graves: Not enough. She never said it straight. We’ll keep an eye on her, but don’t ring her again.',
      burned: 'Who else is on this line? Silence. Then the dial tone, and somewhere a long way off, Graves swearing.',
      hungUp: 'You. Don’t ring this number again. Click.'
    },
    vanessaPitch: 'You called back. Good. Paglia, then Houellebecq, and now he’s bringing Cofnas onto our campus. The brakes, the fire: rehearsals, and we were bad at them. The Cofnas lecture is the last one he hosts. Third time we do it properly, and we need someone nobody is watching. You. Choose carefully. There’s no taking it back.',

    calls: {
      'service:university': [
        { id: 'pv_u_talk', label: 'Ask about Professor Vale’s next guest speaker', stage: ['open'], until: ['debate'],
          reply: 'Professor Vale is hosting Nathan Cofnas at Founders’ Hall on Day {T}. We have had… a great many complaints. Tickets are free.', learn: ['debate'] },
        { id: 'pv_u_diary', label: 'Ask who keeps Professor Vale’s diary', stage: ['open'], until: ['allison'],
          reply: 'His research assistant, Allison Kent. She sends out all his speaker invitations. Shall I put you through? …She’s stepped out. She steps out a lot lately.', learn: ['allison'], exposure: 8 },
        { id: 'pv_u_crossed', label: '', stage: ['open'], needs: ['debate'], until: ['car_bay'], crossed: true },
        { id: 'pv_u_car', label: 'Ask where Professor Vale parks', stage: ['open'], needs: ['debate'], until: ['car_bay'],
          reply: 'Faculty parking lot, bay fourteen, the day after every one of his guests. He likes to come in and read the complaints. Why do you ask?', learn: ['car_bay'], exposure: 10 }
      ],
      'service:newsroom': [
        { id: 'pv_n_link', label: 'Ask whether Vale’s brakes and the fire are connected', stage: ['open'], until: ['rule'],
          reply: 'The brakes failed the day after Paglia. The fire came the day after Houellebecq. We can’t print a pattern without a source.', learn: ['rule'] },
        { id: 'pv_n_groups', label: 'Ask whether any campus group has threatened Vale', stage: ['open'], until: ['back_row'],
          reply: 'The organizers protesting his speakers are loud but harmless. There’s a smaller lot people call the Back Row. Nobody will go on record about them.', learn: ['back_row'], exposure: 5 }
      ],
      'service:police': [
        { id: 'pv_p_graves', label: 'Ask for Detective Eleanor Graves', stage: ['open', 'resolved', 'backrow'], needsAny: ['flag:gravesKnown', 'fact:rule', 'fact:car_plan'], unlessNumber: 'graves',
          reply: 'Graves. Make it quick. …Fine. Here’s my direct line. Use it when you have a name and a day.', effect: 'gravesLine' }
      ],
      'pv:graves': [
        { id: 'tip', label: 'Tell Graves: it’s {name}' },
        { id: 'pv_g_tell', label: 'Tell her you were the one who called it in (ending)' },
        { id: 'pv_g_thanks', label: 'Just say you’re glad he’s safe', reply: 'So am I. Call me if you ever fancy telling me how you knew. She hangs up before you can.' },
        { id: 'pv_g_confess', label: 'Tell Detective Graves everything (ends the game)' },
        { id: 'pv_g_case', label: 'Ask how the Vale case is going', reply: 'It’s going. Don’t make me regret giving you this number.' }
      ],
      'pv:rosa': [
        { id: 'pv_r_reassure', label: 'Talk to her gently about the Back Row' },
        { id: 'pv_r_press', label: 'Press her for names (risky)' },
        { id: 'pv_r_calm', label: 'Calm Rosa down', reply: 'Could anyone else get hurt? Tell me nobody else could get hurt. You tell her nobody who matters. She doesn’t like that answer, but she stops crying.' }
      ],
      'pv:vanessa': [
        { id: 'pv_v_join', label: 'Join the Back Row (final)', reply: 'Good. You build it, at your place, because nobody is watching your place. I’ve circled what you need in today’s classifieds, and I’m sending you a note. For the Semtex, ring Lenny on the garden-shed number and ask for a garden shed clearance. That’s the code word. Never say what it really is. Allison collects it from your doorstep when it’s ready. Then you make one phone call.' },
        { id: 'pv_v_semtex', label: 'Ask Vanessa how to get the Semtex', reply: 'Lenny. The garden-shed number in your Contacts. Ask for a garden shed clearance, nothing else. If you say the real word on the phone, he hangs up, and so do I.' },
        { id: 'pv_v_refuse', label: 'Refuse (final)', reply: 'Shame. Forget this call. I’d forget it really hard, if I were you.' },
        { id: 'pv_v_stall', label: 'Ask for a day to think', reply: 'One day. I don’t like people who think too long.' },
        { id: 'pv_v_phone', label: 'Ask Vanessa to send you a phone', reply: 'Can’t you do anything yourself? A sigh. It’ll be through your letterbox tomorrow.' },
        { id: 'pv_v_ready', label: 'Tell her it’s ready to collect', reply: 'Leave the bag on your doorstep tonight. Don’t watch.', late: 'Too late. Don’t call me again.' },
        { id: 'pv_v_out', label: 'Tell her you want out', early: 'You were never really in. Don’t make me remember you. You’re back on the outside, and the Back Row knows your name.', late: 'Nobody leaves the Back Row, Vanessa says, quite kindly. Then she hangs up.' },
        { id: 'pv_v_yes', label: 'Say yes (ending)' },
        { id: 'pv_v_later', label: 'Not tonight', reply: 'Suit yourself. The offer stands.' }
      ],
      'pv:allison': [
        { id: 'pv_a_car', label: 'Ask about Vale’s car, and who drives it' }
      ],
      'pv:lenny': [
        { id: 'pv_l_order', label: 'Say the code word: a garden shed clearance', reply: 'Two days. Doorstep. Don’t open it in the street. Click.' },
        { id: 'pv_l_ask', label: 'Ask Lenny for Semtex', reply: 'Never heard of it. You want to talk like that, ring someone else. Click.' },
        { id: 'pv_l_chat', label: 'Ask Lenny how business is', reply: 'Booming. Don’t call me unless you’re buying.' }
      ],
      'pv:hendry': [
        { id: 'pv_h_order', label: 'Order a reel of wire for delivery', reply: 'Lovely! That’ll be with you tomorrow. Can I interest you in light bulbs?' },
        { id: 'pv_h_semtex', label: 'Ask if they sell Semtex', reply: 'This is a hardware shop, love. Rope, glue and garden gnomes. Whatever that is, we don’t do it. Try the garden shed clearance in the classifieds, he sells all sorts.' },
        { id: 'pv_h_offers', label: 'Ask about their spring offers', reply: 'Two light bulbs for the price of one, and a very good price on garden gnomes. We deliver!' }
      ],
      'pv:phones': [
        { id: 'pv_ph_order', label: 'Order a cheap pay-as-you-go phone', reply: 'Cash on the doorstep. Tomorrow. Click.' },
        { id: 'pv_ph_semtex', label: 'Ask for Semtex', reply: 'We sell phones. You want sheds, ring Lenny, and learn some manners. Click.' },
        { id: 'pv_ph_chat', label: 'Ask what phones they have', reply: 'Cheap ones. Cash. No names. That’s the whole catalog.' }
      ],
      'pv:device': [
        { id: 'pv_d_call', label: 'Let it ring' }
      ],
      'pv:vale': [],
      'pv:fake': [],
      'pv:alice': [
        { id: 'pv_al_yes', label: 'Accept her invitation to the gala ball (ending)' },
        { id: 'pv_al_later', label: 'Say you’re just glad he’s safe', reply: 'Modest. How very un-Bluebird of you. The invitation stands, darling.' }
      ]
    },
    // Final topics: marked ⚠ in chats and red in your room. They happen on the first tap.
    finalTopics: ['tip', 'pv_g_tell', 'pv_g_confess', 'pv_v_join', 'pv_v_refuse', 'pv_v_ready', 'pv_v_out', 'pv_v_yes', 'pv_d_call', 'pv_al_yes', 'pv_date'],

    rosaLines: {
      low: 'I don’t know what you mean. I sit at the back because the seats are better. She’s scared. Call her again tomorrow.',
      closer: 'I can’t. Not yet. She’s close to telling you more. Call her again tomorrow.',
      vanessa: 'Okay. Vanessa Greer runs it. She calls the brakes and the fire rehearsals. I thought she was joking. She doesn’t joke. Call her again tomorrow.',
      plan: 'Allison Kent keeps his diary. She tells Vanessa where he’ll be. The day after the Cofnas lecture, Day {A}, they’re doing something to his car. Faculty parking lot, bay fourteen. Please don’t say it came from me.',
      pressPrefix: 'Stop pushing! People are listening! Then, very quietly: ',
      burned: 'You gave my name to the police. Don’t ever call me again. Click.'
    },
    gravesLines: {
      tipPlan: '{name}. Faculty parking lot, bay fourteen, Day {A}. Graves writes it down without a word. We’ll be there. Don’t you be.',
      tipNoPlan: '{name}? On what? Bring me when and where. Graves brings her in for questioning anyway and lets her go by evening. By morning the Back Row knows somebody pointed at them.',
      tipEvidence: '{name}. With the device from Vale’s car, that’s enough. The Back Row is in cells by nightfall.',
      tipInnocent: 'We’ll speak to her. By the next day everyone on campus knows {name} was questioned, and nobody will look at you.'
    },
    allisonLines: {
      alone: 'He leaves it in bay fourteen on Day {A}. He drives himself everywhere, alone, singing opera badly at the lights. Don’t call me again.',
      pemberton: 'Bay fourteen, Day {A}. But Pemberton borrows it that day and brings it back. I’ll text you when he’s gone. Wait for my text. Don’t call me again.'
    },
    deviceLines: {
      notCollected: 'Somewhere very close, at your own house, a phone starts to ring.',
      tooEarly: 'It rings and rings. Allison hasn’t put it in place yet. You hang up, sweating.',
      success: 'It rings twice. Then, across town, very far away and very close, there is a sound you will hear for the rest of your life.',
      waited: 'You wait for Allison’s text: Pemberton’s gone. Now. It rings twice. Then, across town, there is a sound you will hear for the rest of your life.',
      wrong: 'It rings twice. Across town, there is a sound you will hear for the rest of your life. You didn’t know Dr. Pemberton had borrowed the car. Nobody told you, because you never asked.',
      done: 'The number is dead. It always will be.'
    },

    workbench: {
      title: 'Your desk',
      note: 'Vanessa’s note: three symbols, in order. Match each item’s sticker to the note.',
      symbols: { semtex: '◇', wire: '○', phone: '□' },
      items: {
        semtex: { label: 'Semtex', image: 'assets/quests/professor/item-semtex.png' },
        wire: { label: 'Wire', image: 'assets/quests/professor/item-wire.png' },
        phone: { label: 'Phone', image: 'assets/quests/professor/item-phone.png' }
      },
      steadyPrompt: 'Steady hands. Tap when the needle is in the green.',
      zone: 0.24, oldWirePenalty: 0.08, heatPenalty: 0.04, speed: 0.9
    },

    // Bedroom sequences, played like the Blue Ribbon home invasion. scene: room | room-open | figure | flash
    sequences: {
      arrested: [
        { scene: 'room', caption: 'Blue lights sweep across your ceiling.' },
        { scene: 'room-open', caption: 'The bedroom door opens. Detective Eleanor Graves.' },
        { scene: 'figure', caption: 'You know why I’m here.' }
      ],
      arrestedHandover: [
        { scene: 'room', caption: 'Car doors outside. Too many of them.' },
        { scene: 'room-open', caption: 'Detective Graves, holding the garden-center bag Allison was carrying.' },
        { scene: 'figure', caption: 'Hands where I can see them.' }
      ],
      confessed: [
        { scene: 'room', caption: 'You put the phone down. It takes a long time for anyone to come.' },
        { scene: 'room-open', caption: 'Two officers. They are almost gentle.' }
      ],
      ownDevice: [
        { scene: 'room', caption: 'The desk lamp flickers.' },
        { scene: 'flash', caption: '' }
      ],
      silenced: [
        { scene: 'room', caption: 'A parcel just inside your door, wrapped in a garden-center bag.' },
        { scene: 'room', caption: 'You don’t remember ordering anything.' },
        { scene: 'flash', caption: '' }
      ]
    },

    // Newspaper stories. image = file name in assets/newspapers/ (no extension).
    news: {
      debate_notice: { section: 'Campus', headline: 'Fury as Professor Vale Invites Controversial Race and Intelligence Researcher', summary: 'Student organizations demand Vale’s resignation ahead of Nathan Cofnas’s lecture at Founders’ Hall on Day {T}.', body: 'Professor Adrian Vale has refused to withdraw his invitation to philosopher Nathan Cofnas, whose writing on intelligence, heredity and group differences is strongly disputed by many researchers. Student organizer Rebecca Shaw called the invitation a platform for scientific racism and delivered a petition demanding Vale’s dismissal. Campus security will be doubled at Founders’ Hall on Day {T}. Organizer Jennifer Tate promised banners, chanting and absolutely no violence. Professor Vale said contested claims should be examined in daylight, not banned in the dark.', image: 'professor_campus', readKey: 'debate' },
      classifieds: { section: 'Classifieds', headline: 'Classifieds', summary: 'GARDEN SHED CLEARANCE, ask for Lenny · HENDRY’S HARDWARE, we deliver · PHONES, unlocked, delivered', body: 'GARDEN SHED CLEARANCE. Old stock, cash only, no questions. Ask for Lenny.\nHENDRY’S HARDWARE. Wire, bulbs, fixings. We deliver!\nPHONES. Unlocked, pay as you go, delivered to your door.', image: 'classifieds', readKey: 'classifieds' },
      innocent_questioned: { section: 'Local', headline: 'Student Questioned Over Professor Incidents', summary: 'Police released {name} without charge. Friends call it a witch hunt.', body: 'A student was questioned and released without charge over the recent incidents involving Professor Adrian Vale. Friends of {name} say she has been hounded off campus.', image: 'police_interview' },
      arrest: { section: 'Front page', headline: 'Back Row Held Over Plot Against Professor', summary: 'Arrests in the faculty parking lot on Day {A}, the day after the Cofnas lecture.', body: 'Detective Eleanor Graves confirmed arrests in the faculty parking lot on Day {A} and thanked a member of the public who wouldn’t let it go. Professor Vale called the plot amateurish, asked whether his car would be returned washed, and confirmed his next guest will be the novelist Bret Easton Ellis.', image: 'police_station' },
      device_found: { section: 'Front page', headline: 'Device Found Under Professor’s Car', summary: 'Professor Vale was staying with Bluebird friends when a volunteer found a suspicious package.', body: 'A Bluebird volunteer collecting Professor Adrian Vale’s car the day after the Cofnas lecture found a suspicious package taped beneath it. Police are hunting those responsible. Professor Vale said he was unbearably safe and that his speaker series would continue.', image: 'professor_device_found' },
      cell_arrested_late: { section: 'Front page', headline: 'Campus Clique Arrested After Car Device Find', summary: 'Police arrested members of the group known as the Back Row.', body: 'Detectives arrested members of a fringe campus group calling itself the Back Row. Mainstream protest organizers said they had never wanted anything to do with them.', image: 'police_station' },
      vale_dead: { section: 'Front page', headline: 'Professor Killed in Car Blast', summary: 'Professor Adrian Vale died on Day {A}, the day after hosting Nathan Cofnas.', body: 'Professor Adrian Vale, the university’s most controversial academic, died on Day {A} in an explosion in the faculty parking lot, the day after hosting philosopher Nathan Cofnas. Police are treating his death as murder and have linked it to two earlier accidents. The university has suspended his speaker series.', image: 'professor_car_blast' },
      appeal: { section: 'Local', headline: 'Police Appeal for Witnesses After Car Blast', summary: 'Detectives want to hear from anyone who saw a garden-center bag near the faculty parking lot.', body: 'Detective Eleanor Graves appealed for witnesses. Somebody carried it in there, she said. Somebody saw them.', image: 'police_evidence' },
      memorial: { section: 'Campus', headline: 'Campus Holds Vigil for Professor Vale', summary: 'Supporters and opponents stood side by side.', body: 'Hundreds gathered outside Founders’ Hall with candles. Protest organizer Rebecca Shaw said: We fought every one of his invitations. We argued with him every week. Nobody wanted this.', image: 'professor_memorial' },
      wrong_man: { section: 'Front page', headline: 'Lecturer Killed in Blast Meant for Colleague', summary: 'Dr. Hal Pemberton died on Day {A} in a car borrowed from Professor Vale.', body: 'Dr. Hal Pemberton, a well-liked lecturer, died on Day {A} in a car borrowed from Professor Adrian Vale. Police believe Professor Vale was the intended target.', image: 'professor_car_blast' },
      player_arrested: { section: 'Front page', headline: 'Local Resident Charged Over Professor Plot', summary: 'Police charged a local resident after a tip-off.', body: 'Detective Eleanor Graves charged a local resident in connection with the plot against Professor Vale. Neighbors described them as quiet, always on their phone.', image: 'police_station' },
      inquiry_stalls: { section: 'Local', headline: 'Vale Inquiry Stalls, Police Admit', summary: 'No arrests yet in the Vale case.', body: 'Detectives admitted the inquiry into Professor Vale’s death had stalled. Detective Graves said the case would stay open for as long as it takes.', image: 'police_roadblock' },
      house_blast: { section: 'Front page', headline: 'Blast Destroys Bedroom on Quiet Road', summary: 'Police found the remains of a desk.', body: 'An explosion destroyed an upstairs bedroom on a quiet residential road. Police found the remains of a desk and a garden-center bag.', image: 'police_evidence' },
      parcel_blast: { section: 'Front page', headline: 'Resident Killed by Parcel Left on Doorstep', summary: 'The parcel was wrapped in a garden-center bag.', body: 'A resident was killed by a parcel left on their doorstep. Police linked it to the campus group known as the Back Row.', image: 'police_evidence' },
      informant: { section: 'Front page', headline: 'Informant Foils Plot Against Professor', summary: 'A member of a campus clique turned themselves in.', body: 'A plot against Professor Adrian Vale was foiled when a member of the group rang police and confessed. Other members were arrested.', image: 'police_station' },
      empty_bay: { section: 'Front page', headline: 'Blast Wrecks Professor’s Empty Car', summary: 'Professor Vale’s car was destroyed in the faculty parking lot on Day {A}. He had taken a cab.', body: 'An explosion destroyed Professor Adrian Vale’s car in bay fourteen of the faculty parking lot on Day {A}, the day after the Cofnas lecture. Nobody was hurt. Professor Vale, who took a cab that morning for reasons he declined to give, said he had never been so pleased to be inconvenienced. Police are hunting those responsible.', image: 'professor_car_blast' },
      brick: { section: 'Campus', headline: 'Brick Through Professor’s Window', summary: 'A note with it read Third time. Professor Vale is unhurt and unimpressed.', body: 'A brick was thrown through the study window of Professor Adrian Vale overnight, two days before his guest Nathan Cofnas speaks at Founders’ Hall. A note tied to it read Third time. Professor Vale called it a pun and said the lecture would go ahead.', image: 'professor_campus' },
      bin_fire: { section: 'Local', headline: 'Professor Unhurt as Bin Fire Ends Fourth Accident', summary: 'Arrests after a bin caught fire near Professor Vale’s car.', body: 'Professor Adrian Vale was unhurt when a bin caught fire near his car, the fourth accident so far. Arrests were made at the scene, one suspect still holding the matches.', image: 'professor_fire' }
    },

    endings: {
      hero_police: { kind: 'complete', title: 'The Detective’s Number', image: 'assets/quests/professor/ending-graves.png',
        text: 'A long silence on the line. You? Do you know how many people call me with theories? You were the one who was right. Another silence. Dinner. Not a debrief. Dinner.\n\nThe Sunfall Daily runs Vale’s face on the front page for days. He gives a lecture about it, then announces his next guest, Bret Easton Ellis, and the campus erupts all over again. You don’t go. You’re busy.',
        dateText: '{name} says yes before you’ve finished typing. Everyone at the station knows who saved Professor Vale, and she wants the whole story, slowly, over dinner.' },
      hero_thunderbirds: { kind: 'complete', win: 'thunderbirds', title: 'Guest of Honor', image: 'assets/quests/professor/ending-thunderbirds.png',
        text: 'Marvelous. Alice Beaumont sends a car for you. At the gala ball you sit at the top table between Alice and a professor who spends the whole dinner pretending he didn’t need saving and telling everyone that Adam Curtis has said yes.\n\nNobody applies to join the Bluebirds. They decide. By the cheese course they have decided about you: a quiet word, a raised glass, and you are one of them. By the coffee, Alice has decided about you too. She takes your arm and doesn’t let go. Across the table three pleasant men with blue ribbons raise their glasses to you, the way you’d welcome a new colleague. Alice wears four gold bands on one finger. She says there’s room for another.\n\nThe wedding is booked before the band packs up. Your search for love is over. A Bluebird woman’s, you gather, never quite is.',
        dateText: '{name} says yes before you’ve finished typing. At the next Bluebird gala ball she walks you to the top table on her arm, and every Bluebird in Sunfall raises a glass to the person who saved Professor Vale.\n\nNobody applies to join the Bluebirds. They decide, and by the coffee they have decided about you. Her mother has the wedding booked before the band packs up. At the reception two cheerful men introduce themselves as her other half. Both of them. They could not be more welcoming.\n\nYour search for love is over. Hers, you gather, never quite is.' },
      back_row_forever: { kind: 'complete', title: 'One of Us', image: 'assets/quests/professor/ending-vanessa.png',
        text: 'Then come over. Vanessa’s apartment is all candles and books with cracked spines. She pours two glasses and doesn’t say his name once. The university has canceled his speaker series, she says. Ellis, Curtis, all of them. The papers will call it unsolved. Let them. The Back Row has a new seat at the front.' },
      pemberton: { kind: 'failure', title: 'The Borrowed Car',
        text: 'Vale took a cab, like you told him. Nobody told Dr. Hal Pemberton, who borrowed the car that morning, the way he always does. The Sunfall Daily runs Pemberton’s photograph with a black border. Vale gives the eulogy, and for once he doesn’t make a joke.' },
      vale_dies: { kind: 'failure', title: 'The Professor Disappeared',
        text: 'The Back Row got it right the third time. The Sunfall Daily runs Vale’s photograph with a black border, and the university quietly cancels the rest of his speakers. You knew, and it wasn’t enough.',
        variants: { walked: 'You walked away, and the Back Row got it right the third time. The Sunfall Daily runs Vale’s photograph with a black border. You’ll always wonder.' } },
      dropped: { kind: 'failure', title: 'Cut Loose',
        text: 'The device never reached the car. Vanessa tried it herself the day after the Cofnas lecture, badly: a fourth failure, a smouldering bin, Vale untouched and arrests by nightfall. Vanessa never says your name to the police. You’ll never know why.' },
      confessed: { kind: 'gameover', title: 'Turned Yourself In', sequence: 'confessed',
        text: 'You tell Detective Graves everything: the voicemail, Lenny, the note, the desk. The Back Row is in cells by nightfall and Professor Vale never learns your name. You get a very long time to think.',
        death: { verb: 'ARRESTED', cause: 'YOUR CONSCIENCE', line: 'Sunfall Daily, Day {n}: Informant Foils Plot Against Professor.' } },
      arrested_handover: { kind: 'gameover', title: 'The Doorstep', sequence: 'arrestedHandover',
        text: 'The police had been watching your house. They took Allison on your doorstep, holding the bag. It took them a minute to come upstairs.',
        death: { verb: 'ARRESTED', cause: 'DETECTIVE GRAVES', line: 'Arrested at home on Day {n}. The bag was still on the doorstep.' } },
      arrested_after: { kind: 'gameover', title: 'The Knock', sequence: 'arrested',
        text: 'Graves knocks once. She doesn’t need to knock twice.',
        variants: {
          heat: 'In the end it was a delivery log from Hendry’s, a phone-shop receipt and a garden-center bag on a doorbell camera. Detective Graves knocks once. She doesn’t need to knock twice.',
          rosa: 'Rosa Gutierrez walked into the police station and told Detective Graves everything. Your name came first.',
          confessed: 'You tell Graves everything. She listens to it twice. It doesn’t bring anyone back.'
        },
        death: { verb: 'ARRESTED', cause: 'DETECTIVE GRAVES', line: 'Sunfall Daily, Day {n}: Local Resident Charged Over Professor Plot.' } },
      wrong_man: { kind: 'gameover', title: 'The Wrong Man', sequence: 'arrested',
        text: 'Dr. Hal Pemberton had borrowed Vale’s car. Vale is alive. Pemberton isn’t. Vanessa won’t answer, and two days later Detective Graves is at your bedroom door.',
        death: { verb: 'ARRESTED', cause: 'DETECTIVE GRAVES', line: 'Sunfall Daily, Day {n}: Local Resident Charged Over Lecturer’s Death.' } },
      own_device: { kind: 'death', title: 'The Desk', sequence: 'ownDevice',
        text: 'Something on the desk goes wrong all at once.',
        death: { verb: 'KILLED', cause: 'YOUR OWN DEVICE', line: 'Sunfall Daily, Day {n}: Blast Destroys Bedroom on Quiet Road.' } },
      silenced: { kind: 'death', title: 'A Parcel on the Doorstep', sequence: 'silenced',
        text: 'You don’t remember ordering anything.',
        death: { verb: 'SILENCED', cause: 'THE BACK ROW', line: 'Sunfall Daily, Day {n}: Resident Killed by Parcel Left on Doorstep.' } }
    }
  };

  // ============================================================= HELPERS ====
  const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
  function hash(input) {
    let h = 2166136261;
    for (const ch of String(input)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return (h >>> 0) || 1;
  }
  function fill(text, vars) {
    return String(text == null ? '' : text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
  }
  const ITEMS = ['semtex', 'wire', 'phone'];
  const validNumber = n => typeof n === 'string' && /^[2-9]\d{6}$/.test(n) && !n.startsWith('555');
  function noteOrderFor(seed) {
    const perms = [['semtex', 'wire', 'phone'], ['wire', 'semtex', 'phone'], ['phone', 'wire', 'semtex'], ['wire', 'phone', 'semtex'], ['semtex', 'phone', 'wire'], ['phone', 'semtex', 'wire']];
    return perms[hash(seed + ':note') % perms.length].slice();
  }

  // ============================================================== ENGINE ====
  // opts.newNumber(usedSet) -> a fresh 7-digit number from the host, so quest numbers never
  // clash with Hinge or service numbers. Without it the engine makes its own.
  function createEngine(D, opts) {
    opts = opts || {};
    const TH = D.thresholds;
    const L = D.lines;
    const STAGES = ['dormant', 'open', 'withdrawn', 'backrow', 'resolved', 'ended'];
    const FACT_IDS = Object.keys(D.facts);
    const ENDING_IDS = Object.keys(D.endings);
    const PEOPLE = Object.keys(D.cast);
    const LINES = Object.keys(D.contacts);
    const FLAGS = ['gravesKnown', 'tbLinked'];

    // ----- state -----
    function fresh(seed) {
      const sd = String(seed == null ? 'match' : seed).slice(0, 200);
      return {
        v: 2, seed: sd, stage: 'dormant',
        openedDay: null, debateDay: null, attackDay: null,
        pemberton: hash(sd + ':pemberton') % 2 === 1,
        noteOrder: noteOrderFor(sd),
        facts: [], flags: [], numbers: {}, asked: {}, daily: {}, inbox: [],
        exposure: 0, lastRiskDay: null,
        rosaTrust: 0, rosaBurned: false,
        offerState: 'none', stallDay: null,
        tip: null, thunderbirdsWarned: null, accused: [],
        cellArrested: false, cellAtLarge: false, silencedDay: null, attackResolved: false,
        favour: { thunderbirds: false, police: false }, arrestCall: false, aliceCall: false,
        joinedDay: null, conf: 0, heat: 0, rosaFear: 0, rosaPanicked: false,
        carIntel: false, oldWire: false, wireFrom: null,
        inv: { semtex: 'none', wire: 'none', phone: 'none' }, due: { semtex: null, wire: null, phone: null },
        device: 'none', assemblyFails: 0, handoverDay: null, detonatedDay: null, wrongMan: false, invited: false,
        valeTalk1: false, valeTalk2: false, valeTrust: 0, valeCar: false, valeCallDay: null, valeOn: 0,
        wireSet: null, wireStep: 0, wireSus: 0, wireGot: [], wireDone: false, wireBurned: false,
        brickDone: false, fakeDone: false, fakeOn: false, fakeCallDay: null, gravesAsk: null, gravesCold: false,
        news: [], log: [],
        ending: null, endingDay: null, endingVariant: null, endingName: null, endingBride: null, endingBrideName: null
      };
    }

    function normalize(raw, seed) {
      const s = fresh(raw && typeof raw.seed === 'string' ? raw.seed : seed);
      if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.v !== 2) return s;
      const intOrNull = v => (Number.isInteger(v) ? v : null);
      const strList = (a, okList, max = 40) => (Array.isArray(a) ? [...new Set(a.filter(x => typeof x === 'string' && x.length <= max && (!okList || okList.includes(x))))] : []);
      for (const k of Object.keys(s)) {
        const val = raw[k];
        if (val === undefined || k === 'seed' || k === 'v') continue;
        switch (k) {
          case 'stage': s.stage = STAGES.includes(val) ? val : 'dormant'; break;
          case 'noteOrder': if (Array.isArray(val) && val.length === 3 && ITEMS.every(i => val.includes(i))) s.noteOrder = val.slice(); break;
          case 'facts': s.facts = strList(val, FACT_IDS); break;
          case 'flags': s.flags = strList(val, FLAGS); break;
          case 'accused': s.accused = strList(val, PEOPLE); break;
          case 'wireGot': s.wireGot = strList(val, ['day', 'place']); break;
          case 'numbers': s.numbers = {}; if (val && typeof val === 'object') for (const id of LINES) if (validNumber(val[id])) s.numbers[id] = val[id]; break;
          case 'asked': s.asked = {}; if (val && typeof val === 'object') for (const key of Object.keys(val).slice(0, 300)) if (key.length <= 60) s.asked[key] = strList(val[key], null, 40); break;
          case 'daily': s.daily = {}; if (val && typeof val === 'object') for (const key of ['rosa', 'assemble']) if (Number.isInteger(val[key])) s.daily[key] = val[key]; break;
          case 'inbox': s.inbox = Array.isArray(val) ? val.filter(m => m && Number.isInteger(m.day) && D.voicemails[m.key]).slice(-30).map(m => ({ day: m.day, key: m.key })) : []; break;
          case 'offerState': s.offerState = ['none', 'waiting', 'stalled', 'joined', 'refused'].includes(val) ? val : 'none'; break;
          case 'tip': s.tip = val && PEOPLE.includes(val.name) && Number.isInteger(val.day) ? { name: val.name, day: val.day, withPlan: val.withPlan === true } : null; break;
          case 'favour': s.favour = { thunderbirds: !!(val && val.thunderbirds === true), police: !!(val && val.police === true) }; break;
          case 'inv': for (const i of ITEMS) s.inv[i] = val && ['none', 'ordered', 'have'].includes(val[i]) ? val[i] : 'none'; break;
          case 'due': for (const i of ITEMS) s.due[i] = val ? intOrNull(val[i]) : null; break;
          case 'device': s.device = ['none', 'assembled', 'waiting', 'collected', 'detonated'].includes(val) ? val : 'none'; break;
          case 'news': s.news = Array.isArray(val) ? val.filter(n => n && Number.isInteger(n.day) && D.news[n.key]).slice(0, 60).map(n => ({ day: n.day, key: n.key, vars: n.vars && typeof n.vars.name === 'string' ? { name: n.vars.name.slice(0, 60) } : {} })) : []; break;
          case 'log': s.log = Array.isArray(val) ? val.filter(x => typeof x === 'string').slice(-40).map(x => x.slice(0, 700)) : []; break;
          case 'ending': s.ending = ENDING_IDS.includes(val) ? val : null; break;
          case 'endingVariant': case 'endingName': case 'endingBride': case 'endingBrideName': case 'wireFrom': s[k] = typeof val === 'string' ? val.slice(0, 60) : null; break;
          default: {
            const base = s[k];
            if (typeof base === 'boolean') s[k] = val === true;
            else if (typeof base === 'number') s[k] = Number.isFinite(val) ? val : base;
            else if (base === null) s[k] = intOrNull(val);
          }
        }
      }
      for (const m of ['exposure', 'rosaTrust', 'heat', 'conf', 'rosaFear']) s[m] = clamp(s[m]);
      s.valeTrust = clamp(Math.floor(s.valeTrust), 0, 5); s.valeOn = [0, 1, 2].includes(s.valeOn) ? s.valeOn : 0;
      s.wireStep = clamp(Math.floor(s.wireStep), 0, D.wiretap.steps.length); s.wireSus = clamp(Math.floor(s.wireSus), -3, 10);
      s.assemblyFails = clamp(Math.floor(s.assemblyFails), 0, 1);
      if (s.ending) s.stage = 'ended';
      if (s.stage !== 'dormant' && (s.debateDay === null || s.attackDay === null)) s.stage = 'dormant';
      return s;
    }

    // ----- helpers -----
    const has = (s, f) => s.facts.includes(f);
    const flag = (s, f) => s.flags.includes(f);
    const vars = (s, extra) => Object.assign({ T: s.debateDay, A: s.attackDay }, extra || {});
    function say(s, text, extra) {
      const t = fill(text, vars(s, extra));
      if (t) { s.log.push(t); if (s.log.length > 40) s.log.shift(); }
      return t;
    }
    const ok = (s, text, extra, more) => Object.assign({ ok: true, text: say(s, text, extra) }, more || {});
    const no = text => ({ ok: false, text });
    function learn(s, f) {
      if (!FACT_IDS.includes(f) || has(s, f)) return false;
      s.facts.push(f);
      if (has(s, 'car_story') && has(s, 'fire_story') && !has(s, 'rule')) s.facts.push('rule');
      if (!has(s, 'car_plan') && D.deduction.needs.every(x => has(s, x))) { s.facts.push('car_plan'); say(s, D.deduction.text); }
      if (f === 'car_plan' && !has(s, 'debate')) s.facts.push('debate');   // the plan names the day after the debate
      return true;
    }
    const learnAll = (s, list) => (list || []).forEach(f => learn(s, f));
    function setFlag(s, f) { if (FLAGS.includes(f) && !flag(s, f)) s.flags.push(f); }
    function risk(s, n, day) { if (n > 0) { s.exposure = clamp(s.exposure + n); s.lastRiskDay = day; } }
    const bump = (s, key, by) => { s[key] = clamp(s[key] + by); };
    function news(s, day, key, v) { if (!s.news.some(n => n.day === day && n.key === key)) s.news.push({ day, key, vars: v || {} }); }
    function giveNumber(s, id) {
      if (s.numbers[id]) return s.numbers[id];
      const used = new Set(Object.values(s.numbers));
      let n = opts.newNumber ? opts.newNumber(used) : null;
      let i = 0;
      while (!validNumber(n) || used.has(n)) n = String(2000000 + (hash(s.seed + ':num:' + id + ':' + (i++)) % 8000000));
      s.numbers[id] = n;
      return n;
    }
    function voicemail(s, day, key) {
      if (key === 'valeBrick') D.voicemails.valeBrick.text = D.tricks.brickVm;
      if (key === 'fakeGraves') D.voicemails.fakeGraves.text = D.tricks.fake.vm;
      if (s.inbox.some(m => m.key === key)) return null;
      s.inbox.push({ day, key });
      giveNumber(s, D.voicemails[key].from);
      return key;
    }
    function open(s, day) {
      if (s.stage !== 'dormant') return false;
      s.stage = 'open'; s.openedDay = day;
      s.debateDay = day + D.debateGap; s.attackDay = s.debateDay + 1;
      return true;
    }
    function end(s, id, day, variant, name) {
      s.ending = id; s.stage = 'ended'; s.endingDay = day;
      s.endingVariant = variant || null; s.endingName = name || null;
      if (D.endings[id].win && opts.bride) { // the Bluebirds marry you off: the host picks her
        const b = opts.bride(s.endingBride);
        if (b) { s.endingBride = b.id; s.endingBrideName = b.name; }
      }
      return endingInfo(s);
    }
    function endingInfo(s) {
      if (!s.ending) return null;
      const e = D.endings[s.ending];
      const v = vars(s, { name: s.endingName || '', n: (s.endingDay || 0) + 1, bride: s.endingBrideName || 'Alice Beaumont' });
      let text = e.text;
      if (s.endingVariant === 'date' && e.dateText) text = e.dateText;
      else if (s.endingVariant && e.variants && e.variants[s.endingVariant]) text = e.variants[s.endingVariant];
      return {
        id: s.ending, kind: e.kind, title: fill(e.title, v), text: fill(text, v), image: e.image || null,
        win: e.win || null, bride: e.win ? s.endingBride : null,
        sequence: e.sequence ? D.sequences[e.sequence].map(x => ({ scene: x.scene, caption: fill(x.caption, v) })) : null,
        death: e.death ? { verb: e.death.verb, cause: e.death.cause, line: fill(e.death.line || '', v) } : null
      };
    }
    function withEnding(s, r) { if (r && s.ending) r.ending = endingInfo(s); return r; }
    const isProtect = s => s.stage === 'open' || s.stage === 'resolved';
    const allItems = s => ITEMS.every(i => s.inv[i] === 'have');
    const usedToday = (s, key, day) => s.daily[key] === day;

    // ----- newspaper -----
    // key: 'car' | 'fire' | 'campus' for the game's existing Vale stories, or a quest story's readKey.
    function onNewsRead(s, key, day) {
      if (s.ending) return null;
      if (['car', 'fire', 'campus'].includes(key) && s.stage === 'dormant') { open(s, day); say(s, L.opened); }
      if (key === 'classifieds' && s.stage === 'backrow') {
        const fresh = ['lenny', 'hendry', 'phones'].filter(id => !s.numbers[id]);
        fresh.forEach(id => giveNumber(s, id));
        return fresh.length ? ok(s, L.classifiedsRead) : null;
      }
      const map = { car: 'car_story', fire: 'fire_story', debate: 'debate' };
      if (map[key] && s.stage !== 'dormant') {
        const hadRule = has(s, 'rule');
        if (learn(s, map[key])) {
          const r = ok(s, L.newsLearned[key]);
          if (!hadRule && has(s, 'rule')) r.text += ' ' + say(s, L.ruleLearned);
          return r;
        }
      }
      return null;
    }
    function story(s, key, day, v) {
      const n = D.news[key];
      const vv = vars(s, v);
      const headline = fill(n.headline, vv);
      return { id: `pv_${key}_${day}`, quest: D.id, key, day, section: n.section, title: headline, headline, summary: fill(n.summary, vv), body: fill(n.body, vv), image: n.image, imagePath: `assets/newspapers/${n.image}.png`, readKey: n.readKey || null };
    }
    function newsFor(s, day) {
      const out = s.news.filter(n => n.day === day).map(n => story(s, n.key, day, n.vars));
      if (s.stage !== 'dormant' && !s.ending && day === s.debateDay - 1) out.push(story(s, 'debate_notice', day));
      if (s.stage === 'backrow' && day >= s.joinedDay && s.device === 'none' && !allItems(s)) out.push(story(s, 'classifieds', day));
      return out;
    }

    // ----- new day -----
    // Call once each time Start Another Day finishes, after world.day has gone up and before
    // today's paper is built. Returns { events:[text], room:[caption], voicemails:[key], ending? }.
    function newDay(s, day) {
      const out = { events: [], room: [], voicemails: [] };
      if (s.ending) return out;
      const push = t => { const x = say(s, t); if (x) out.events.push(x); };
      const roomEvent = t => { const x = say(s, t); if (x) out.room.push(x); };
      const vm = key => { if (voicemail(s, day, key)) { out.voicemails.push(key); push(L.voicemail); } };
      const finish = () => { out.ending = endingInfo(s); return out; };

      if (s.stage === 'dormant' && day >= D.autoOpenDay) { open(s, day); push(L.autoOpened); }
      if (s.stage === 'dormant') return out;

      // Deliveries arrive overnight.
      for (const it of ITEMS) if (s.inv[it] === 'ordered' && s.due[it] !== null && day >= s.due[it]) { s.inv[it] = 'have'; s.due[it] = null; roomEvent(it === 'wire' && s.wireFrom ? fill(D.room.wireGift, { name: s.wireFrom }) : D.room[it]); }

      // The Back Row deals with people who know too much.
      if (s.silencedDay !== null && day >= s.silencedDay && !s.cellArrested) { news(s, day + 1, 'parcel_blast'); end(s, 'silenced', day); return finish(); }
      if (isProtect(s) && !s.cellArrested && s.exposure >= TH.exposureDeath) { news(s, day + 1, 'parcel_blast'); end(s, 'silenced', day); return finish(); }

      // Exposure cools on quiet days.
      if (isProtect(s) && s.exposure > 0 && s.lastRiskDay !== null && s.lastRiskDay < day - 1) s.exposure = clamp(s.exposure - TH.exposureDecay);

      // A brick through Vale's window, two days before the lecture: the danger is closing in.
      if (s.stage === 'open' && !s.brickDone && day === s.debateDay - 2) {
        s.brickDone = true; news(s, day, 'brick');
        if (s.numbers.vale) vm('valeBrick');
      }
      // People ring the player back.
      if (s.stage === 'open' && day <= s.attackDay) {
        if (has(s, 'back_row') && !s.rosaBurned) vm('rosa');
        if (has(s, 'back_row') && s.offerState === 'none') { s.offerState = 'waiting'; vm('vanessa'); }
        if (s.offerState === 'stalled' && day > s.stallDay + 1) { s.offerState = 'refused'; risk(s, 10, day); push('Vanessa stopped waiting for your answer.'); }
      }

      // Protect: the attack happens on attackDay and is reported the next morning.
      if ((s.stage === 'open' || s.stage === 'withdrawn') && day >= s.attackDay + 1 && !s.attackResolved) {
        s.attackResolved = true;
        const tipOk = s.tip && s.tip.withPlan && D.cell.includes(s.tip.name) && s.tip.day <= s.attackDay;
        const tbOk = s.thunderbirdsWarned !== null && s.thunderbirdsWarned <= s.attackDay;
        if (tipOk) {
          s.cellArrested = true; s.favour.police = !s.gravesCold; s.arrestCall = !s.gravesCold; // you wouldn't say how you knew: no call back
          if (tbOk) { s.favour.thunderbirds = true; s.aliceCall = true; }
          news(s, day, 'arrest');
          s.stage = 'resolved';
          if (!s.gravesCold) vm('gravesArrest');
          if (tbOk) vm('alice');
          return out;
        }
        if (tbOk) {
          s.favour.thunderbirds = true; s.cellAtLarge = true; s.aliceCall = true;
          news(s, day, 'device_found');
          s.stage = 'resolved';
          if (s.exposure >= TH.silencedExposure) s.silencedDay = day + 2;
          vm('alice');
          return out;
        }
        if (s.valeCar) { // he took a cab, like you told him
          if (s.pemberton) { news(s, day, 'wrong_man'); end(s, 'pemberton', day); return finish(); }
          s.cellAtLarge = true; s.stage = 'resolved';
          news(s, day, 'empty_bay');
          if (s.exposure >= TH.silencedExposure) s.silencedDay = day + 2;
          vm('valeThanks');
          return out;
        }
        news(s, day, 'vale_dead'); news(s, day + 1, 'memorial');
        end(s, 'vale_dies', day, s.stage === 'withdrawn' ? 'walked' : null);
        return finish();
      }

      // Back Row.
      if (s.stage === 'backrow') {
        if (s.device === 'detonated' && s.wrongMan) {
          if (day >= s.detonatedDay + 2) { news(s, day, 'player_arrested'); end(s, 'wrong_man', day); return finish(); }
          push(L.wrongManNextDay);
          return out;
        }
        if (s.device === 'waiting' && day > s.handoverDay) {
          if (s.heat >= TH.heatArrestAtHandover) { news(s, day + 1, 'player_arrested'); end(s, 'arrested_handover', day); return finish(); }
          s.device = 'collected'; bump(s, 'heat', 5); roomEvent(D.room.collected);
        }
        if (s.device !== 'detonated' && day > s.attackDay) { news(s, day, 'bin_fire'); end(s, 'dropped', day); return finish(); }
        bump(s, 'rosaFear', s.device === 'detonated' ? TH.rosaDailyAfter : TH.rosaDaily);
        if (s.device === 'detonated') bump(s, 'heat', 6);
        if (s.rosaFear >= TH.rosaBreaks) { news(s, day, 'player_arrested'); end(s, 'arrested_after', day, 'rosa'); return finish(); }
        if (s.heat >= TH.heatArrestAfter) { news(s, day, 'player_arrested'); end(s, 'arrested_after', day, 'heat'); return finish(); }
        if (s.rosaFear >= TH.rosaWarn && !s.rosaPanicked) { s.rosaPanicked = true; vm('rosaPanic'); }
        if (s.device === 'detonated') {
          if (day === s.detonatedDay + 2) news(s, day, 'inquiry_stalls');
          if (day >= s.detonatedDay + D.quietDaysToWin && !s.invited) { s.invited = true; vm('vanessaInvite'); }
          else push(L.quietDay);
        }
        if (s.heat >= TH.heatWarn) push(L.heatWarn);
        return out;
      }

      if (isProtect(s) && s.exposure >= TH.exposureWarn && !s.cellArrested) push(L.exposureWarn);
      return out;
    }

    // ----- shared topic rules -----
    function baseAvailable(s, t, askedList) {
      if (s.ending) return false;
      if (t.stage && !t.stage.includes(s.stage)) return false;
      if (t.needs && !t.needs.every(f => has(s, f))) return false;
      if (t.until && t.until.every(f => has(s, f))) return false;
      if (t.needsFlag && !flag(s, t.needsFlag)) return false;
      if (t.needsAny && !t.needsAny.some(x => (x.startsWith('flag:') ? flag(s, x.slice(5)) : has(s, x.slice(5))))) return false;
      if (t.unlessNumber && s.numbers[t.unlessNumber]) return false;
      if (askedList && askedList.includes(t.id)) return false;
      return true;
    }
    function applyEffects(s, t, day) {
      learnAll(s, t.learn);
      if (t.flag) setFlag(s, t.flag);
      risk(s, t.exposure || 0, day);
      if (t.effect === 'vanessaCalls' && s.offerState === 'none' && s.stage === 'open') { s.offerState = 'waiting'; voicemail(s, day, 'vanessa'); }
      if (t.effect === 'rosaCalls' && !s.rosaBurned) voicemail(s, day, 'rosa');
      if (t.effect === 'gravesLine') { setFlag(s, 'gravesKnown'); giveNumber(s, 'graves'); }
      if (t.effect === 'warnThunderbirds' && s.thunderbirdsWarned === null) s.thunderbirdsWarned = day;
    }
    const isFinal = id => D.finalTopics.includes(id) || id.startsWith('tip_');

    // ----- Hinge -----
    // Extra topics for one woman's chat. profile = existing Hinge profile { id, name, factionId }.
    function hingeTopics(s, profile) {
      if (!profile || s.ending) return [];
      const asked = s.asked[profile.id] || [];
      const list = (D.hinge[profile.factionId] || []).filter(t => baseAvailable(s, t, asked)).map(t => ({ id: t.id, label: fill(t.label, vars(s)), confirm: false }));
      const d = dateTopicFor(s, profile);
      if (d) list.push(d);
      return list;
    }
    // Returns { ok, player, reply }: post the player's line, then her reply after the usual delay.
    function chooseHinge(s, profile, topicId, day) {
      if (!profile) return no(L.unavailable);
      if (topicId === 'pv_date') return askOnDate(s, profile, day);
      const base = (D.hinge[profile.factionId] || []).find(t => t.id === topicId);
      const asked = s.asked[profile.id] || [];
      if (!base || !baseAvailable(s, base, asked)) return no(L.unavailable);
      s.asked[profile.id] = asked.concat(topicId);
      const t = Object.assign({}, base, (base.as && base.as[profile.id]) || {});
      const plan = has(s, 'car_plan');
      applyEffects(s, t, day);
      const text = t.effect === 'warnThunderbirds' && plan && t.replyPlan ? t.replyPlan : t.reply;
      const reply = say(s, text);
      return withEnding(s, { ok: true, player: fill(t.player, vars(s)), reply, text: reply });
    }
    function dateTopicFor(s, profile) {
      if (!profile || s.ending || s.stage !== 'resolved' || !s.favour[profile.factionId]) return null;
      return { id: 'pv_date', label: 'Ask her on a date', confirm: true };
    }
    function askOnDate(s, profile, day) {
      if (!dateTopicFor(s, profile)) return no(L.unavailable);
      if (profile.factionId === 'thunderbirds') s.endingBride = profile.id; // the one you asked out is the bride
      end(s, profile.factionId === 'police' ? 'hero_police' : 'hero_thunderbirds', day, 'date', profile.name);
      return withEnding(s, { ok: true, player: 'So… dinner? A real one.', reply: '', text: '' });
    }

    // ----- phone lines -----
    function contactForNumber(s, number) {
      const id = LINES.find(k => s.numbers[k] === number);
      if (!id) return null;
      const c = D.contacts[id];
      return { id: 'pv:' + id, name: c.name, portrait: c.portrait, greeting: lineGreeting(s, id) };
    }
    function lineGreeting(s, id) {
      if (id === 'vanessa' && wireLive(s)) return D.wiretap.open;
      if (id === 'vanessa' && s.wireBurned) return D.wiretap.hungUp;
      if (id === 'vanessa' && s.stage === 'open' && (s.offerState === 'waiting' || s.offerState === 'stalled')) return D.vanessaPitch;
      if (id === 'rosa' && s.rosaBurned) return D.rosaLines.burned;
      return D.contacts[id].greeting;
    }
    function knownLines(s) {
      return LINES.filter(id => s.numbers[id]).map(id => ({ id: 'pv:' + id, key: id, name: D.contacts[id].name, number: s.numbers[id] }));
    }

    // Topics for a call. lineId: 'service:police' | 'service:newsroom' | 'service:university' | 'pv:<contact>'.
    function lineTopics(s, lineId, day) {
      if (s.ending) return [];
      const out = [];
      const add = (id, label) => out.push({ id, label, confirm: isFinal(id) });
      if (lineId.startsWith('service:')) {
        const asked = s.asked[lineId] || [];
        for (const t of D.calls[lineId] || []) if (baseAvailable(s, t, asked)) add(t.id, fill(t.crossed ? D.tricks.crossed.label : t.label, vars(s)));
        return out;
      }
      const key = lineId.slice(3);
      if (!s.numbers[key] || !D.calls[lineId]) return out;
      const label = id => D.calls[lineId].find(t => t.id === id).label;
      switch (key) {
        case 'graves': {
          if (s.gravesAsk === day) { for (const [k, text] of Object.entries(D.tricks.how.choices)) add('pv_g_how_' + k, text); break; } // how do you know? (on that call only)
          if ((s.stage === 'open' && !s.attackResolved && day <= s.attackDay) || (s.stage === 'resolved' && s.cellAtLarge)) {
            const names = [];
            if (has(s, 'vanessa')) names.push('vanessa');
            if (has(s, 'allison')) names.push('allison');
            if (has(s, 'jennifer')) names.push('jennifer');
            if (has(s, 'back_row')) names.push('rebecca');
            if (s.numbers.rosa) names.push('rosa');
            for (const n of names) if (!s.accused.includes(n)) add('tip_' + n, fill(label('tip'), { name: D.cast[n].name }));
          }
          if (s.stage === 'resolved' && s.arrestCall) { add('pv_g_tell', label('pv_g_tell')); add('pv_g_thanks', label('pv_g_thanks')); }
          if (s.stage === 'backrow' || (s.joinedDay !== null && s.silencedDay !== null)) add('pv_g_confess', label('pv_g_confess'));
          if (!out.length) add('pv_g_case', label('pv_g_case'));
          break;
        }
        case 'rosa':
          if (s.rosaBurned || usedToday(s, 'rosa', day)) break;
          if (s.stage === 'open' && !has(s, 'car_plan')) { add('pv_r_reassure', label('pv_r_reassure')); add('pv_r_press', label('pv_r_press')); }
          if (s.stage === 'backrow') add('pv_r_calm', label('pv_r_calm'));
          break;
        case 'vanessa':
          if (wireLive(s, day)) { // Graves is listening
            const ch = D.wiretap.steps[s.wireStep].choices, keys = Object.keys(ch), shift = hash(s.seed + ':wire:' + s.wireStep) % keys.length;
            keys.map((_, i) => keys[(i + shift) % keys.length]).forEach(k => add('pv_w_' + k, ch[k].label));
            break;
          }
          if (s.wireBurned) break; // she knows you're with the police
          if (s.stage === 'open' && (s.offerState === 'waiting' || s.offerState === 'stalled')) {
            add('pv_v_join', label('pv_v_join')); add('pv_v_refuse', label('pv_v_refuse'));
            if (s.offerState === 'waiting') add('pv_v_stall', label('pv_v_stall'));
          }
          if (s.stage === 'backrow') {
            if (s.inv.semtex === 'none') add('pv_v_semtex', label('pv_v_semtex'));
            if (s.inv.phone === 'none') add('pv_v_phone', label('pv_v_phone'));
            if (s.device === 'assembled') add('pv_v_ready', label('pv_v_ready'));
            if (s.invited) { add('pv_v_yes', label('pv_v_yes')); add('pv_v_later', label('pv_v_later')); }
            if (s.device !== 'detonated') add('pv_v_out', label('pv_v_out'));
          }
          break;
        case 'allison': if (s.stage === 'backrow' && !s.carIntel) add('pv_a_car', label('pv_a_car')); break;
        case 'lenny':
          if (s.stage === 'backrow' && s.inv.semtex === 'none') { add('pv_l_order', label('pv_l_order')); add('pv_l_ask', label('pv_l_ask')); }
          else add('pv_l_chat', label('pv_l_chat'));
          break;
        case 'hendry':
          if (s.stage === 'backrow' && s.inv.wire === 'none') add('pv_h_order', label('pv_h_order'));
          if (s.stage === 'backrow' && s.inv.semtex === 'none') add('pv_h_semtex', label('pv_h_semtex'));
          add('pv_h_offers', label('pv_h_offers'));
          break;
        case 'phones':
          if (s.stage === 'backrow' && s.inv.phone === 'none') add('pv_ph_order', label('pv_ph_order'));
          if (s.stage === 'backrow' && s.inv.semtex === 'none') add('pv_ph_semtex', label('pv_ph_semtex'));
          add('pv_ph_chat', label('pv_ph_chat'));
          break;
        case 'device': if (s.stage === 'backrow') add('pv_d_call', label('pv_d_call')); break;
        case 'alice': if (s.stage === 'resolved' && s.aliceCall) { add('pv_al_yes', label('pv_al_yes')); add('pv_al_later', label('pv_al_later')); } break;
        case 'vale': {
          const phase = valePhase(s, day);
          if (phase) for (const [k, text] of Object.entries(D.vale['call' + phase].choices)) { if (k !== 'hang') add(`pv_va_${phase}_${k}`, text); }
          else add('pv_va_chat', 'Ask how he is');
          if (s.numbers.vale) for (const t of valeTalkTopics(s)) add('pv_vt_' + t.key, t.label); // talk to him
          break;
        }
        default: break;
      }
      return out;
    }

    // Returns { ok, reply } where reply is what the other person says, plus ending info if any.
    function chooseLine(s, lineId, topicId, day) {
      if (s.ending) return no(L.over);
      if (lineId === 'pv:vale' && topicId === 'pv_va_chat' && s.numbers.vale) return ok(s, D.vale.chat);
      if (!lineTopics(s, lineId, day).some(t => t.id === topicId)) return no(L.unavailable);
      const r = withEnding(s, runLine(s, lineId, topicId, day));
      r.reply = r.text;
      return r;
    }

    function runLine(s, lineId, id, day) {
      if (lineId === 'pv:vale' && id.startsWith('pv_vt_')) return valeTalk(s, id.slice(6));
      if (lineId === 'pv:vale' && id.startsWith('pv_va_')) { const [, , phase, k] = id.split('_'); return valeAnswerChoice(s, Number(phase), k, day); }
      if (lineId === 'pv:vanessa' && id.startsWith('pv_w_')) return wireChoice(s, id.slice(5), day);
      if (lineId.startsWith('service:')) {
        const t = D.calls[lineId].find(x => x.id === id);
        s.asked[lineId] = (s.asked[lineId] || []).concat(id);
        if (t.crossed) { learn(s, 'car_bay'); learn(s, 'allison'); risk(s, 12, day); return ok(s, D.tricks.crossed.reply); } // a crossed line: you overhear Allison
        applyEffects(s, t, day);
        return ok(s, t.reply);
      }
      const key = lineId.slice(3);
      const T = tid => D.calls[lineId].find(x => x.id === tid);
      const name = n => D.cast[n].name;
      switch (key) {
        case 'graves': {
          if (id.startsWith('pv_g_how_')) {
            const k = id.slice(9); s.gravesAsk = null;
            if (k === 'friend') risk(s, 10, day);
            if (k === 'secret') s.gravesCold = true; // she won't ring you back when it's over
            return ok(s, D.tricks.how[k]);
          }
          if (id.startsWith('tip_')) {
            const n = id.slice(4);
            s.accused.push(n);
            if (D.cell.includes(n)) {
              if (s.cellAtLarge) { s.cellArrested = true; s.cellAtLarge = false; s.silencedDay = null; s.favour.police = true; news(s, day + 1, 'cell_arrested_late'); return ok(s, D.gravesLines.tipEvidence, { name: name(n) }); }
              if (has(s, 'car_plan')) { s.tip = { name: n, day, withPlan: true }; s.gravesAsk = day; return ok(s, D.gravesLines.tipPlan + ' ' + D.tricks.how.open, { name: name(n) }); }
              if (n === 'vanessa' && s.numbers.vanessa && !s.wireDone && s.stage === 'open' && day < s.attackDay) { // ring her, I'll listen
                s.wireSet = day; s.wireStep = 0; s.wireSus = 0; s.wireGot = [];
                s.accused = s.accused.filter(x => x !== 'vanessa');
                return ok(s, D.wiretap.setup, { name: name(n) });
              }
              if (!s.tip) s.tip = { name: n, day, withPlan: false };
              risk(s, 25, day);
              return ok(s, D.gravesLines.tipNoPlan, { name: name(n) });
            }
            risk(s, 15, day);
            if (n === 'rosa') { s.rosaBurned = true; s.rosaTrust = 0; }
            news(s, day + 1, 'innocent_questioned', { name: name(n) });
            return ok(s, D.gravesLines.tipInnocent, { name: name(n) });
          }
          if (id === 'pv_g_tell') { end(s, 'hero_police', day); return ok(s, ''); }
          if (id === 'pv_g_thanks') { s.arrestCall = false; return ok(s, T(id).reply); }
          if (id === 'pv_g_confess') {
            if (s.device === 'detonated') { news(s, day + 1, 'player_arrested'); end(s, 'arrested_after', day, 'confessed'); return ok(s, ''); }
            news(s, day + 1, 'informant'); end(s, 'confessed', day); return ok(s, '');
          }
          return ok(s, T('pv_g_case').reply);
        }
        case 'rosa': {
          s.daily.rosa = day;
          if (id === 'pv_r_calm') { bump(s, 'rosaFear', -TH.rosaCalm); return ok(s, T(id).reply); }
          const press = id === 'pv_r_press';
          bump(s, 'rosaTrust', press ? 10 : 25);
          if (press) risk(s, 15, day);
          const disc = press ? TH.pressDiscount : 0;
          const R = D.rosaLines;
          let text = R.low;
          if (s.rosaTrust >= TH.rosaPlan - disc) { learn(s, 'vanessa'); learn(s, 'allison'); learn(s, 'car_bay'); learn(s, 'car_plan'); text = R.plan; }
          else if (s.rosaTrust >= TH.rosaVanessa - disc) { text = has(s, 'vanessa') ? R.closer : R.vanessa; learn(s, 'vanessa'); }
          return ok(s, (press ? R.pressPrefix : '') + text);
        }
        case 'vanessa': {
          const t = T(id);
          if (id === 'pv_v_join') {
            s.stage = 'backrow'; s.offerState = 'joined'; s.joinedDay = day;
            s.conf = 30; s.heat = 0; s.rosaFear = 20;
            learn(s, 'vanessa'); learn(s, 'allison'); learn(s, 'car_bay'); learn(s, 'car_plan'); learn(s, 'codeword');
            ['allison', 'rosa', 'lenny', 'hendry', 'phones'].forEach(n => giveNumber(s, n));
            return ok(s, t.reply);
          }
          if (id === 'pv_v_refuse') { s.offerState = 'refused'; risk(s, 15, day); return ok(s, t.reply); }
          if (id === 'pv_v_stall') { s.offerState = 'stalled'; s.stallDay = day; return ok(s, t.reply); }
          if (id === 'pv_v_semtex') { learn(s, 'codeword'); return ok(s, t.reply); }
          if (id === 'pv_v_phone') { s.inv.phone = 'ordered'; s.due.phone = day + 1; bump(s, 'conf', -5); return ok(s, t.reply); }
          if (id === 'pv_v_ready') {
            if (day > s.attackDay - 1) return ok(s, t.late);
            s.device = 'waiting'; s.handoverDay = day; return ok(s, t.reply);
          }
          if (id === 'pv_v_out') {
            s.offerState = 'refused';
            if (s.device === 'none' && s.inv.semtex === 'none') { s.stage = 'open'; s.exposure = clamp(Math.max(s.exposure, 40)); s.lastRiskDay = day; return ok(s, t.early); }
            s.silencedDay = day + 2; s.stage = 'open'; s.attackResolved = true;
            return ok(s, t.late);
          }
          if (id === 'pv_v_yes') { end(s, 'back_row_forever', day); return ok(s, ''); }
          return ok(s, T('pv_v_later').reply);
        }
        case 'allison':
          s.carIntel = true; bump(s, 'conf', 5);
          return ok(s, s.pemberton ? D.allisonLines.pemberton : D.allisonLines.alone);
        case 'lenny':
          if (id === 'pv_l_chat') return ok(s, T(id).reply);
          if (id === 'pv_l_ask') { bump(s, 'heat', 6); return ok(s, T(id).reply); } // saying it on the phone is careless
          s.inv.semtex = 'ordered'; s.due.semtex = day + 2; bump(s, 'heat', 12); return ok(s, T(id).reply);
        case 'hendry':
          if (id !== 'pv_h_order') return ok(s, T(id).reply);
          s.inv.wire = 'ordered'; s.due.wire = day + 1; bump(s, 'heat', 4); return ok(s, T(id).reply);
        case 'phones':
          if (id !== 'pv_ph_order') return ok(s, T(id).reply);
          s.inv.phone = 'ordered'; s.due.phone = day + 1; bump(s, 'heat', 8); return ok(s, T(id).reply);
        case 'device': {
          const DL = D.deviceLines;
          if (s.device === 'assembled' || s.device === 'waiting') { news(s, day + 1, 'house_blast'); end(s, 'own_device', day); return ok(s, DL.notCollected); }
          if (s.device === 'detonated') return ok(s, DL.done);
          if (s.device !== 'collected' || day < s.attackDay) return ok(s, DL.tooEarly);
          s.device = 'detonated'; s.detonatedDay = day;
          if (s.pemberton && !s.carIntel) { s.wrongMan = true; bump(s, 'heat', 40); news(s, day + 1, 'wrong_man'); return ok(s, DL.wrong); }
          bump(s, 'heat', 15); bump(s, 'rosaFear', TH.rosaAtBlast);
          news(s, day + 1, 'vale_dead'); news(s, day + 2, 'appeal'); news(s, day + 3, 'memorial');
          return ok(s, s.pemberton ? DL.waited : DL.success);
        }
        case 'alice':
          if (id === 'pv_al_yes') { end(s, 'hero_thunderbirds', day); return ok(s, ''); }
          s.aliceCall = false; return ok(s, T(id).reply);
        default: return no(L.unavailable);
      }
    }

    // ----- Vale rings you -----
    // 1: the first time, once someone has told him you've been asking (before the lecture).
    // 2: the night of the lecture, whatever happened before. Returns 0 when he isn't due.
    function valePhase(s, day) {
      if (s.ending || s.stage !== 'open' || s.attackResolved) return 0;
      if (day >= s.debateDay && day < s.attackDay) return s.valeTalk2 ? 0 : 2;
      if (day < s.debateDay) return s.valeTalk1 ? 0 : 1;
      return 0;
    }
    function valeDue(s, day) {
      const phase = valePhase(s, day);
      if (!phase || s.valeCallDay === day) return 0;
      if (phase === 1) return !s.inbox.some(m => m.key === 'valeVm1') && day > s.openedDay && (s.exposure >= 8 || has(s, 'rule')) ? 1 : 0;
      return !s.inbox.some(m => m.key === 'valeVm2') ? 2 : 0;
    }
    function valeRang(s, day) { s.valeOn = valeDue(s, day); s.valeCallDay = day; return s.valeOn; }
    function valeOpening(s) {
      if (s.valeOn === 1) return fill(D.vale.call1.open, vars(s));
      if (s.valeOn === 2) return fill(s.valeTalk1 ? D.vale.call2.known : D.vale.call2.stranger, vars(s));
      return '';
    }
    // What you can still talk to him about: four at a time, then the lessons.
    function valeTalkTopics(s) {
      const said = s.asked['vale:talk'] || [], out = [];
      for (const [k, t] of Object.entries(D.vale.talk)) {
        if (said.includes(k) || (t.after && !said.includes(t.after)) || (t.needTrust && s.valeTrust < t.needTrust)) continue;
        out.push({ key: k, label: t.label });
      }
      const lessons = said.filter(k => /^lesson\d+$/.test(k)).length;
      return [...out.slice(0, 3), ...(lessons <= D.vale.lessons.length ? [{ key: 'lesson', label: D.vale.lessonLabel }] : [])];
    }
    function valeTalk(s, key) {
      const said = s.asked['vale:talk'] || (s.asked['vale:talk'] = []);
      if (key === 'lesson') {
        const n = said.filter(k => /^lesson\d+$/.test(k)).length;
        if (n >= D.vale.lessons.length) { said.push('lesson' + n); return Object.assign(ok(s, D.vale.lessonsDone), { more: true }); }
        said.push('lesson' + n); s.valeTrust = clamp(s.valeTrust + 1, 0, 5);
        return Object.assign(ok(s, D.vale.lessons[n]), { more: true });
      }
      const t = D.vale.talk[key];
      if (!t || said.includes(key)) return no(L.unavailable);
      said.push(key);
      if (t.trust) s.valeTrust = clamp(s.valeTrust + t.trust, 0, 5);
      learnAll(s, t.learn);
      return Object.assign(ok(s, fill(t.text, vars(s))), { more: true });
    }
    function valeCallChoices(s) {
      if (!s.valeOn) return [];
      if (s.valeMenu) return [...valeTalkTopics(s).slice(-4).map(t => ({ id: 'vale:t:' + t.key, label: t.label })), { id: 'vale:back', label: 'Back' }]; // the topics, a few at a time
      const acts = Object.entries(D.vale['call' + s.valeOn].choices).filter(([k]) => k !== 'hang').map(([k, label]) => ({ id: 'vale:' + k, label }));
      return [...acts, { id: 'vale:talk', label: D.vale.talkLabel }, { id: 'vale:hang', label: D.vale['call' + s.valeOn].choices.hang || 'Hang up' }];
    }
    function valeCallChoose(s, id, day) {
      if (id === 'vale:talk' || id === 'vale:back') { if (!s.valeOn || s.ending) return no(L.unavailable); s.valeMenu = id === 'vale:talk'; return Object.assign(ok(s, s.valeMenu ? D.vale.talkOpen : D.vale.talkBack), { more: true }); }
      if (String(id).startsWith('vale:t:')) { if (!s.valeOn || s.ending) return no(L.unavailable); giveNumber(s, 'vale'); if (s.valeOn === 1) s.valeTalk1 = true; return valeTalk(s, String(id).slice(7)); } // talking keeps the call going
      const phase = s.valeOn; s.valeOn = 0; s.valeMenu = false;
      if (!phase || s.ending) return no(L.unavailable);
      return valeAnswerChoice(s, phase, String(id).replace(/^vale:/, ''), day);
    }
    function valeAnswerChoice(s, phase, k, day) {
      const C = D.vale['call' + phase];
      if (!C || !C.choices[k]) return no(L.unavailable);
      giveNumber(s, 'vale');
      if (phase === 1) {
        s.valeTalk1 = true;
        if (k === 'hang') return Object.assign(ok(s, ''), { hang: true });
        s.valeTrust = clamp(s.valeTrust + (k === 'fan' ? 2 : 1), 0, 5);
        learn(s, 'debate');
        if (k === 'fan') learn(s, 'allison');
        return ok(s, C[k]);
      }
      s.valeTalk2 = true;
      if (k === 'hang') return Object.assign(ok(s, ''), { hang: true });
      if (k === 'car') {
        const yes = s.valeTrust >= 2 || (s.valeTrust >= 1 && has(s, 'car_plan'));
        if (yes) s.valeCar = true;
        return ok(s, yes ? C.carYes : C.carNo);
      }
      if (k === 'stay') {
        const yes = s.valeTrust >= 1 || has(s, 'car_plan');
        if (yes && s.thunderbirdsWarned === null) s.thunderbirdsWarned = day; // he stays with Alice: the Bluebirds find it
        return ok(s, yes ? C.stayYes : C.stayNo);
      }
      return ok(s, C.luck);
    }
    function valeMissed(s, day) {
      const phase = s.valeOn; s.valeOn = 0;
      if (phase === 1) voicemail(s, day, 'valeVm1');
      if (phase === 2) voicemail(s, day, 'valeVm2');
      return phase;
    }

    // ----- a fake detective rings: the Back Row testing what you know -----
    function fakeDue(s, day) {
      return !s.ending && s.stage === 'open' && !s.attackResolved && !s.fakeDone && s.fakeCallDay !== day && has(s, 'back_row') && s.exposure >= 30 && day >= s.openedDay + 2 && day < s.attackDay;
    }
    function fakeRang(s, day) { s.fakeOn = fakeDue(s, day); s.fakeCallDay = day; giveNumber(s, 'fake'); return s.fakeOn; }
    function fakeOpening(s) { return s.fakeOn ? D.tricks.fake.open : ''; }
    function fakeCallChoices(s) { return s.fakeOn ? Object.entries(D.tricks.fake.choices).map(([k, label]) => ({ id: 'fake:' + k, label })) : []; }
    function fakeCallChoose(s, id, day) {
      if (!s.fakeOn) return no(L.unavailable);
      s.fakeOn = false; s.fakeDone = true;
      const k = String(id).replace(/^fake:/, '');
      if (k === 'hang') return Object.assign(ok(s, ''), { hang: true });
      if (k === 'tell') { risk(s, 40, day); if (s.exposure >= TH.silencedExposure) s.silencedDay = day + 2; return ok(s, D.tricks.fake.tell); } // you told the Back Row
      return ok(s, D.tricks.fake.callback + ' ' + say(s, D.tricks.fake.clue));
    }
    function fakeMissed(s, day) { if (!s.fakeOn) return false; s.fakeOn = false; s.fakeDone = true; voicemail(s, day, 'fakeGraves'); return true; }

    // ----- the University Office: Lorraine notices you -----
    const campusTier = s => (s.exposure >= TH.exposureWarn ? 2 : s.exposure >= 25 ? 1 : 0);
    function serviceGreeting(s, lineId) {
      if (lineId !== 'service:university' || s.stage === 'dormant') return null;
      return D.university.greet[campusTier(s)];
    }

    // ----- the wiretap: ring Vanessa while Graves listens -----
    const wireLive = (s, day) => s.wireSet !== null && !s.wireDone && s.stage === 'open' && !s.attackResolved && (day === undefined || day < s.attackDay);
    function wireChoice(s, k, day) {
      const step = D.wiretap.steps[s.wireStep], c = step && step.choices[k];
      if (!c || !wireLive(s, day)) return no(L.unavailable);
      s.wireSus += c.sus;
      if (c.got && !s.wireGot.includes(c.got)) s.wireGot.push(c.got);
      if (s.wireSus >= D.wiretap.burnAt) { // she knows someone's listening
        s.wireDone = true; s.wireBurned = true; s.offerState = 'refused';
        risk(s, 40, day);
        if (s.exposure >= TH.silencedExposure) s.silencedDay = day + 2;
        return ok(s, c.reply + ' ' + D.wiretap.burned);
      }
      s.wireStep++;
      if (s.wireStep < D.wiretap.steps.length) return ok(s, c.reply);
      s.wireDone = true;
      if (['day', 'place'].every(g => s.wireGot.includes(g))) {
        learn(s, 'vanessa'); learn(s, 'car_bay'); learn(s, 'car_plan');
        s.tip = { name: 'vanessa', day, withPlan: true }; s.offerState = 'refused';
        return ok(s, c.reply + ' ' + D.wiretap.win);
      }
      return ok(s, c.reply + ' ' + D.wiretap.partial);
    }

    // ----- things done in the player's own room (buttons in the case file in the bedside cupboard) -----
    function roomActions(s) {
      const out = [];
      if (s.stage === 'open') out.push({ id: 'walk_away', label: 'Walk away from the case', desc: 'Stop asking. Vale is on his own.', confirm: true });
      if (s.stage === 'backrow') {
        if (s.device === 'none') out.push({ id: 'assemble', label: 'Assemble it at your desk', desc: allItems(s) ? 'Two mistakes and it’s over. One try a day.' : 'You need the Semtex, the wire and the phone first.', enabled: allItems(s) });
      }
      return out.map(a => Object.assign({ enabled: true, confirm: false }, a));
    }
    function roomAction(s, id, day) {
      if (s.ending) return no(L.over);
      const a = roomActions(s).find(x => x.id === id);
      if (!a || !a.enabled) return no(L.unavailable);
      if (id === 'walk_away') { s.stage = 'withdrawn'; return ok(s, L.walkAway); }
      if (usedToday(s, 'assemble', day)) return no(L.assembleRested);
      return { ok: true, workbench: workbenchConfig(s), text: say(s, L.assembleStart) };
    }

    // A woman whose job gives her wire (a florist, a jewellery maker, a sound engineer...) drops a
    // reel round. It arrives tomorrow like an order, but there's no receipt, so no police heat.
    function wireNeeded(s) { return !s.ending && s.stage === 'backrow' && s.inv.wire === 'none'; }
    function wireFromFriend(s, name, day) {
      if (s.ending) return no(L.over);
      if (!wireNeeded(s)) return no(L.unavailable);
      s.inv.wire = 'ordered'; s.due.wire = day + 1; s.wireFrom = String(name || 'A friend').slice(0, 60);
      return ok(s, fill(L.wireFriend, { name: s.wireFrom }));
    }

    // One short hint for the case file: a nudge, never the answer.
    function hintFor(s) {
      if (s.ending || s.stage === 'dormant' || s.stage === 'withdrawn' || s.stage === 'resolved') return null;
      if (s.stage === 'backrow') {
        if (s.device !== 'none') return s.device === 'assembled' ? 'Vanessa will want to know.' : null;
        if (s.inv.semtex === 'none') return 'Vanessa gave you a word to say.';
        if (s.inv.wire === 'none') return 'Lots of women in Sunfall work with wire: florists, jewelry makers, sound engineers, gardeners. Ring one and ask her.'; // clearer (Chris, 4 November 2026)
        if (s.inv.phone === 'none') return 'Somebody in the classifieds sells phones.';
        return allItems(s) ? 'Your desk is waiting.' : null;
      }
      if (wireLive(s)) return 'Graves is waiting for you to ring Vanessa.';
      if (!has(s, 'rule')) return 'Two accidents. Look at what happened the day before each.';
      if (!has(s, 'debate')) return 'Who is Vale bringing to campus next?';
      if (!has(s, 'allison')) return 'Somebody keeps Vale’s diary.';
      if (!has(s, 'car_bay')) return 'Where does his car spend the day after?';
      if (has(s, 'car_plan')) return 'A detective wants a name and a day.';
      return null;
    }

    // ----- workbench -----
    function workbenchConfig(s) {
      const W = D.workbench;
      const zone = Math.max(0.1, W.zone - (s.oldWire ? W.oldWirePenalty : 0) - (s.heat >= 50 ? W.heatPenalty : 0));
      return {
        title: W.title, note: W.note, prompt: W.steadyPrompt,
        order: s.noteOrder.slice(), noteSymbols: s.noteOrder.map(i => W.symbols[i]),
        items: ITEMS.map(i => ({ id: i, label: W.items[i].label, image: W.items[i].image, symbol: W.symbols[i] })),
        zone, speed: W.speed + (s.assemblyFails ? 0.25 : 0), mistakesLeft: 2 - s.assemblyFails
      };
    }
    // result: { order: ['wire','semtex','phone'], steady: true|false }
    function assembleResult(s, day, result) {
      if (s.ending || s.stage !== 'backrow' || s.device !== 'none' || !allItems(s) || usedToday(s, 'assemble', day)) return no(L.unavailable);
      s.daily.assemble = day;
      const order = result && Array.isArray(result.order) ? result.order : [];
      const orderOk = order.length === 3 && order.every((x, i) => x === s.noteOrder[i]);
      const steady = !!(result && result.steady);
      if (orderOk && steady) { s.device = 'assembled'; giveNumber(s, 'device'); return ok(s, L.assembleOk, null, { success: true }); }
      if (s.assemblyFails >= 1) { news(s, day + 1, 'house_blast'); end(s, 'own_device', day); return withEnding(s, ok(s, L.assembleBoom)); }
      s.assemblyFails = 1;
      return ok(s, orderOk ? L.assembleShaky : L.assembleWrong, null, { success: false });
    }

    // ----- case-file view (the host shows it in the bedside cupboard) -----
    function knownRole(s, id) {
      const c = D.cast[id];
      const knows = { vanessa: has(s, 'vanessa'), allison: has(s, 'car_plan') || s.stage === 'backrow', rosa: s.rosaTrust >= TH.rosaVanessa || s.stage === 'backrow', jennifer: has(s, 'jennifer_clear'), rebecca: has(s, 'back_row') };
      return knows[id] === false && c.blurb ? c.blurb : c.role;
    }
    // The next piece Rosa can give you, in the order the case needs it. Null once there is nothing left to give.
    const HELP_ORDER = ['debate', 'back_row', 'vanessa', 'rule', 'car_plan'];
    function helpLead(s) {
      if (s.stage !== 'open' || s.attackResolved || s.ending) return null;
      const fact = HELP_ORDER.find(f => !has(s, f));
      if (fact) return { fact, text: fill(D.help[fact], vars(s)) };
      if (!s.numbers.graves) return { fact: 'graves', text: fill(D.help.graves, vars(s)) };
      return null;
    }
    function helpGive(s, day) {
      const lead = helpLead(s);
      if (!lead) return no('');
      giveNumber(s, 'rosa');
      if (lead.fact === 'graves') { setFlag(s, 'gravesKnown'); giveNumber(s, 'graves'); }
      else learn(s, lead.fact);
      return ok(s, lead.text);
    }
    function caseFile(s, day) {
      const meters = [];
      if (isProtect(s) || s.stage === 'withdrawn') {
        meters.push({ id: 'exposure', label: 'Exposure', value: s.exposure, danger: s.exposure >= TH.exposureWarn, hint: 'How much the Back Row has noticed your questions. Quiet days lower it. At 100 they deal with you.' });
        if (s.numbers.rosa && !s.rosaBurned && s.stage === 'open') meters.push({ id: 'rosaTrust', label: 'Rosa’s trust', value: s.rosaTrust, danger: false, hint: 'At 50 she names the leader. At 75 she tells you the plan. One call a day.' });
      }
      if (s.stage === 'backrow') {
        meters.push({ id: 'heat', label: 'Police heat', value: s.heat, danger: s.heat >= TH.heatWarn, hint: `At ${TH.heatArrestAtHandover} they’re watching your doorstep. At ${TH.heatArrestAfter} they come upstairs.` });
        meters.push({ id: 'rosaFear', label: 'Rosa’s nerves', value: s.rosaFear, danger: s.rosaFear >= TH.rosaWarn, hint: `At ${TH.rosaBreaks} she goes to the police. Call her to calm her, once a day.` });
      }
      const todo = [];
      if (s.stage === 'open' && !s.attackResolved) {
        if (!has(s, 'rule')) todo.push(D.hints.rule);
        if (!has(s, 'debate')) todo.push(D.hints.debate);
        if (!has(s, 'back_row')) todo.push(D.hints.back_row);
        else if (!has(s, 'vanessa')) todo.push(D.hints.vanessa);
        if (!has(s, 'car_plan')) todo.push(D.hints.car_plan);
        if (!(s.tip && s.tip.withPlan) && s.thunderbirdsWarned === null) todo.push(fill(D.hints.stop, vars(s)));
      }
      if (s.stage === 'resolved') {
        if (s.arrestCall) todo.push('Detective Graves wants you to call her back.');
        if (s.aliceCall) todo.push('Alice Beaumont wants you to call her back.');
        const f = [s.favour.police && 'Police', s.favour.thunderbirds && 'Bluebird'].filter(Boolean);
        if (f.length) todo.push(`Any ${f.join(' or ')} match will say yes to a date now.`);
        if (s.cellAtLarge && s.silencedDay !== null) todo.push(`The Back Row is still free and knows your name. Give Detective Graves a name before Day ${s.silencedDay}.`);
      }
      if (s.stage === 'backrow' && s.device !== 'detonated') {
        const need = ITEMS.filter(i => s.inv[i] !== 'have').map(i => D.workbench.items[i].label + (s.inv[i] === 'ordered' ? ' (arriving soon)' : ''));
        if (need.length) todo.push('Still need: ' + need.join(', ') + '. Ring the circled numbers, or a friend whose job gives her wire.');
        if (!need.length && s.device === 'none') todo.push('Assemble it at your desk.');
        if (!s.carIntel) todo.push('Ring Allison Kent about Vale’s car.');
        if (s.device === 'assembled') todo.push(`Ring Vanessa: tell her it’s ready, by Day ${s.attackDay - 1}.`);
        if (s.device === 'assembled' || s.device === 'waiting') todo.push(L.deviceOnDesk);
        if (s.device === 'collected') todo.push(`On Day ${s.attackDay}, ring the number on the masking tape.`);
      }
      if (s.stage === 'backrow' && s.rosaFear >= TH.rosaWarn) todo.unshift(`Rosa is panicking (${s.rosaFear}/${TH.rosaBreaks}). Call her and calm her down today.`);
      if (s.stage === 'backrow' && s.device === 'detonated' && !s.wrongMan) todo.push(s.invited ? 'Vanessa wants you to call her.' : `Keep your head down. Keep police heat under ${TH.heatArrestAfter} and Rosa calm.`);
      const people = ['vanessa', 'allison', 'rosa', 'rebecca', 'jennifer']
        .filter(id => has(s, id) || (id === 'rosa' && s.numbers.rosa) || (id === 'rebecca' && has(s, 'back_row')) || (id === 'vanessa' && s.numbers.vanessa))
        .map(id => ({ id, name: D.cast[id].name, role: knownRole(s, id) }));
      const routeName = { open: 'Investigating', withdrawn: 'Walked away', backrow: 'The Back Row', resolved: 'Vale is safe', ended: 'Closed', dormant: '' }[s.stage];
      return {
        title: D.title, stage: s.stage, routeName, day,
        debateDay: has(s, 'debate') ? s.debateDay : null,
        attackDay: has(s, 'car_plan') ? s.attackDay : null,
        meters, todo,
        facts: s.facts.map(f => fill(D.facts[f], vars(s))),
        people,
        voicemails: s.inbox.slice().reverse().map(m => ({ day: m.day, from: D.contacts[D.voicemails[m.key].from].name, text: fill(D.voicemails[m.key].text, vars(s)) })),
        numbers: knownLines(s),
        inventory: s.stage === 'backrow' ? ITEMS.map(i => ({ id: i, label: D.workbench.items[i].label, status: s.inv[i], image: D.workbench.items[i].image })) : [],
        device: s.device,
        actions: roomActions(s),
        hint: hintFor(s),
        campus: isProtect(s) || s.stage === 'withdrawn' ? D.university.word[campusTier(s)] : null,
        log: s.log.slice(-5),
        ending: endingInfo(s)
      };
    }

    return {
      fresh, normalize, newDay, onNewsRead, newsFor,
      hingeTopics, chooseHinge, dateTopicFor, askOnDate,
      contactForNumber, knownLines, lineTopics, chooseLine,
      roomActions, roomAction, workbenchConfig, assembleResult, wireNeeded, wireFromFriend,
      caseFile, endingInfo, helpLead, helpGive,
      valeDue, valeRang, valeOpening, valeCallChoices, valeCallChoose, valeMissed, serviceGreeting,
      fakeDue, fakeRang, fakeOpening, fakeCallChoices, fakeCallChoose, fakeMissed,
      profileToPerson: profileId => PEOPLE.find(p => D.cast[p].profileId === profileId) || null
    };
  }

  // ================================================================== UI ====
  /*
   * mount(host) connects the engine to the phone. The host passes in the game functions it
   * needs (all optional except world):
   *   world()                 the game's world object (has .day). Quest state: world.professorVale
   *   assetUrl(path)          URL for an asset (handles the standalone build's inline images)
   *   newNumber(usedSet)      a fresh 7-digit number that clashes with nothing else in the game
   *   status(text)            the game's status line
   *   showRoomCaption(text)   a caption over the bedroom for overnight arrivals (falls back to status)
   *   playSequence(steps,cb)  play bedroom frames like the Blue Ribbon home invasion, then call cb()
   *                           steps: [{ scene: 'room'|'room-open'|'figure'|'flash', caption }]
   *   showDeath(info)         the game's death screen: drawDeathTitle(info.cause, info.verb),
   *                           info.line into #fatal-overlay p, then add class "visible"
   *   overlayRoot()           element that full-screen overlays go into (the phone stage)
   *   save()                  autosave after big moments
   *   onChange()              refresh badges and any open screen
   *   seed()                  run seed
   */
  function mount(host) {
    const E = createEngine(DATA, { newNumber: host.newNumber, bride: host.bride });
    const doc = typeof document !== 'undefined' ? document : null;
    const asset = p => (host.assetUrl ? host.assetUrl(p) : p);
    const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    let pageEl = null;
    let lastText = '';

    function state() {
      const w = host.world();
      if (!w.professorVale || w.professorVale.v !== 2 || !w.professorVale.noteOrder) w.professorVale = E.normalize(w.professorVale, host.seed ? host.seed() : 'match');
      return w.professorVale;
    }
    const day = () => host.world().day;

    function after(r) {
      if (!r) return r;
      if (r.text) { lastText = r.text; if (host.status) host.status(r.text); }
      if (r.workbench) openWorkbench(r.workbench);
      const s = state();
      if (s.ending) finishWithEnding(E.endingInfo(s));
      if (host.save) host.save();
      if (host.onChange) host.onChange();
      render();
      return r;
    }

    // ----- case page -----
    function renderNotesPage(el) { pageEl = el; injectCss(); render(); }
    function render() {
      if (!pageEl || !doc || !pageEl.isConnected) return;
      const s = state();
      const v = E.caseFile(s, day());
      if (s.stage === 'dormant') { pageEl.innerHTML = `<div class="pv-case"><h3>${esc(v.title)}</h3><p class="pv-muted">Nothing here yet. Keep reading the Sunfall Daily.</p></div>`; return; }
      // A final action (marked in red) happens on the first tap, like every choice.
      const btn = (id, label, desc, enabled, final) => `<button class="pv-btn${final ? ' pv-final' : ''}" data-pv-room="${esc(id)}" ${enabled ? '' : 'disabled'}>${esc(label)}${desc ? `<small>${esc(desc)}</small>` : ''}</button>`;
      let h = `<div class="pv-case"><h3>${esc(v.title)}</h3><div class="pv-sub">${esc(v.routeName)} · Day ${v.day}${v.debateDay ? ` · Cofnas lecture Day ${v.debateDay}` : ''}${v.attackDay ? ` · Attack Day ${v.attackDay}` : ''}</div>`;
      if (lastText) h += `<div class="pv-last">${esc(lastText)}</div>`;
      if (v.hint) h += `<div class="pv-hint">Hint: ${esc(v.hint)}</div>`;
      if (v.campus) h += `<div class="pv-sub">Word on campus: ${esc(v.campus)}</div>`;
      if (v.meters.length && !(host.elsewhere && host.elsewhere.meters)) h += `<div class="pv-meters">${v.meters.map(m => `<div class="pv-meter${m.danger ? ' pv-danger' : ''}"><span>${esc(m.label)}</span><i><b style="width:${m.value}%"></b></i><em>${m.value}</em><small>${esc(m.hint)}</small></div>`).join('')}</div>`;
      if (v.todo.length && !(host.elsewhere && host.elsewhere.todo)) h += `<h4>Next</h4><ul class="pv-list">${v.todo.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
      if (v.voicemails.length && !(host.elsewhere && host.elsewhere.voicemails)) h += `<h4>Voicemail</h4>${v.voicemails.map(m => `<div class="pv-vm"><b>Day ${m.day} · ${esc(m.from)}</b><br>${esc(m.text)}</div>`).join('')}`;
      if (v.numbers.length && !(host.elsewhere && host.elsewhere.numbers)) h += `<h4>Numbers</h4>${v.numbers.map(n => `<p class="contact-entry"><b>${esc(n.name)}</b><br><button class="notes-call" data-note-dial="${esc(n.number)}">${esc(n.number)} ☎</button></p>`).join('')}`;
      if (v.inventory.length) h += `<h4>On your desk</h4><div class="pv-inv">${v.inventory.map(i => `<div class="pv-item pv-${esc(i.status)}"><img src="${esc(asset(i.image))}" alt="" onerror="this.remove()"><span>${esc(i.label)}</span><small>${esc({ none: 'need', ordered: 'arriving', have: 'here' }[i.status])}</small></div>`).join('')}<div class="pv-item"><span>Device</span><small>${esc({ none: 'not built', assembled: 'on your desk', waiting: 'on the doorstep', collected: 'with Allison', detonated: 'gone' }[v.device])}</small></div></div>`;
      if (v.actions.length) h += `<h4>In your room</h4>${v.actions.map(a => btn(a.id, a.label, a.desc, a.enabled, a.confirm)).join('')}`;
      if (v.people.length) h += `<h4>People</h4><ul class="pv-list">${v.people.map(p => `<li><b>${esc(p.name)}</b>: ${esc(p.role)}</li>`).join('')}</ul>`;
      if (v.facts.length) h += `<h4>What you know</h4><ul class="pv-list">${v.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`;
      if (v.ending) h += `<div class="pv-last"><b>${esc(v.ending.title)}</b><br>${esc(v.ending.text)}</div>`;
      h += '</div>';
      pageEl.innerHTML = h;
      pageEl.onclick = ev => {
        const b = ev.target.closest && ev.target.closest('[data-pv-room]');
        if (!b || b.disabled) return;   // number buttons use the game's own data-note-dial handler
        const id = b.getAttribute('data-pv-room');
        after(E.roomAction(state(), id, day()));
      };
    }

    // ----- workbench (overlay on the bedroom desk) -----
    function openWorkbench(cfg) {
      if (!doc) return;
      injectCss();
      const rootEl = host.overlayRoot ? host.overlayRoot() : doc.body;
      const ov = doc.createElement('div');
      ov.className = 'pv-overlay pv-bench';
      ov.style.backgroundImage = `linear-gradient(rgba(10,6,8,.72),rgba(10,6,8,.9)),url("${asset('assets/quests/professor/workbench.png')}")`;
      const placed = [];
      let raf = 0, pos = 0;
      ov.innerHTML = `<div class="pv-panel"><h2>${esc(cfg.title)}</h2>
        <div class="pv-note"><img src="${esc(asset('assets/quests/professor/vanessa-note.png'))}" alt="" onerror="this.remove()"><div><p>${esc(cfg.note)}</p><div class="pv-symbols">${cfg.noteSymbols.map(x => `<span>${esc(x)}</span>`).join('')}</div></div></div>
        <div class="pv-slots">${[0, 1, 2].map(i => `<div class="pv-slot">${i + 1}</div>`).join('')}</div>
        <div class="pv-tray">${cfg.items.map(i => `<button class="pv-tool" data-item="${esc(i.id)}"><img src="${esc(asset(i.image))}" alt="" onerror="this.remove()"><span>${esc(i.label)}</span><b>${esc(i.symbol)}</b></button>`).join('')}</div>
        <div class="pv-steady pv-hidden"><p>${esc(cfg.prompt)}</p><div class="pv-track"><i class="pv-zone"></i><i class="pv-needle"></i></div><button class="pv-btn pv-final" data-steady>Hold steady</button></div>
        <div class="pv-foot"><button class="pv-btn" data-reset>Start again</button><button class="pv-btn" data-leave>Put it all away</button></div>
        <p class="pv-muted">Mistakes left before disaster: ${cfg.mistakesLeft}</p></div>`;
      rootEl.appendChild(ov);
      const slots = [...ov.querySelectorAll('.pv-slot')];
      const zoneEl = ov.querySelector('.pv-zone');
      const needle = ov.querySelector('.pv-needle');
      const center = 0.3 + Math.random() * 0.4;
      zoneEl.style.left = `${(center - cfg.zone / 2) * 100}%`;
      zoneEl.style.width = `${cfg.zone * 100}%`;
      const close = () => { cancelAnimationFrame(raf); ov.remove(); render(); };
      const finish = steady => { cancelAnimationFrame(raf); const r = E.assembleResult(state(), day(), { order: placed.slice(), steady }); ov.remove(); after(r); };
      const startSteady = () => {
        ov.querySelector('.pv-tray').classList.add('pv-hidden');
        ov.querySelector('.pv-steady').classList.remove('pv-hidden');
        const t0 = performance.now();
        const tick = now => { pos = (Math.sin((now - t0) / 1000 * Math.PI * cfg.speed) + 1) / 2; needle.style.left = `${pos * 100}%`; raf = requestAnimationFrame(tick); };
        raf = requestAnimationFrame(tick);
      };
      ov.addEventListener('click', ev => {
        const t = ev.target.closest('button');
        if (!t) return;
        if (t.hasAttribute('data-leave')) return close();
        if (t.hasAttribute('data-reset')) { placed.length = 0; slots.forEach((sl, i) => { sl.textContent = String(i + 1); }); ov.querySelectorAll('.pv-tool').forEach(x => { x.disabled = false; }); return; }
        if (t.hasAttribute('data-steady')) return finish(Math.abs(pos - center) <= cfg.zone / 2);
        const item = t.getAttribute('data-item');
        if (item && placed.length < 3) {
          placed.push(item); t.disabled = true;
          const it = cfg.items.find(i => i.id === item);
          slots[placed.length - 1].textContent = `${it.symbol} ${it.label}`;
          if (placed.length === 3) { if (placed.every((x, i) => x === cfg.order[i])) startSteady(); else finish(false); }
        }
      });
      // Parts already connected in the order chosen elsewhere (the host's bedside cupboard).
      if (cfg.presetOrder) {
        cfg.presetOrder.forEach((id, i) => { placed.push(id); const it = cfg.items.find(x => x.id === id); if (slots[i] && it) slots[i].textContent = `${it.symbol} ${it.label}`; });
        ov.querySelectorAll('.pv-tool').forEach(x => { x.disabled = true; });
        if (typeof requestAnimationFrame === 'function') startSteady();
      }
    }
    // Build the device from parts connected in the host's cupboard, in the order chosen there.
    // The wrong order is an assembly mistake, exactly as at the desk; the right order goes
    // straight to the steady-hands tap.
    function assembleFromParts(order) {
      const s = state();
      const r = E.roomAction(s, 'assemble', day());
      if (!r || !r.workbench) return after(r);
      const right = Array.isArray(order) && order.length === 3 && order.every((x, i) => x === r.workbench.order[i]);
      if (!right) return after(E.assembleResult(s, day(), { order: order || [], steady: false }));
      if (host.status && r.text) host.status(r.text);
      openWorkbench(Object.assign({}, r.workbench, { presetOrder: order }));
      return r;
    }

    // ----- endings -----
    let endingShown = null;
    function finishWithEnding(info) {
      if (!info || !doc || endingShown === info.id) return;
      endingShown = info.id;
      const show = () => {
        if (info.death && host.showDeath) return host.showDeath(Object.assign({ title: info.title, text: info.text }, info.death));
        showCard(info);
      };
      if (info.sequence && host.playSequence) host.playSequence(info.sequence, show);
      else if (info.sequence) playFallbackSequence(info.sequence, show);
      else show();
    }
    function showCard(info) {
      injectCss();
      const rootEl = host.overlayRoot ? host.overlayRoot() : doc.body;
      const ov = doc.createElement('div');
      ov.className = `pv-overlay pv-ending pv-${esc(info.kind)}`;
      const kind = { complete: 'CASE CLOSED', failure: 'CASE CLOSED', gameover: 'GAME OVER', death: 'GAME OVER' }[info.kind];
      ov.innerHTML = `<div class="pv-panel">${info.image ? `<img class="pv-art" src="${esc(asset(info.image))}" alt="" onerror="this.remove()">` : ''}<div class="pv-kind">${esc(kind)}</div><h2>${esc(info.title)}</h2>${info.text.split('\n\n').map(p => `<p>${esc(p)}</p>`).join('')}${info.death ? `<p class="pv-muted">YOU WERE ${esc(info.death.verb)} BY ${esc(info.death.cause)}</p>` : ''}<button class="pv-btn" data-close>Continue</button></div>`;
      ov.addEventListener('click', ev => { if (!ev.target.closest('[data-close]')) return; ov.remove(); if (info.win && host.win) host.win(info); }); // the Bluebird ending goes on to the wedding
      rootEl.appendChild(ov);
    }
    function playFallbackSequence(steps, done) {
      injectCss();
      const rootEl = host.overlayRoot ? host.overlayRoot() : doc.body;
      const ov = doc.createElement('div');
      ov.className = 'pv-overlay pv-seq';
      rootEl.appendChild(ov);
      steps.forEach((st, i) => setTimeout(() => { ov.className = `pv-overlay pv-seq pv-scene-${st.scene}`; ov.innerHTML = `<p>${esc(st.caption)}</p>`; }, i * 1600));
      setTimeout(() => { ov.remove(); done(); }, steps.length * 1600 + 400);
    }

    // ----- hooks the host calls -----
    function onNewDay(d) {
      const s = state();
      const r = E.newDay(s, d === undefined ? day() : d);
      for (const caption of r.room) { if (host.showRoomCaption) host.showRoomCaption(caption); else if (host.status) host.status(caption); }
      if (r.events.length && host.status) host.status(r.events[r.events.length - 1]);
      lastText = r.room.concat(r.events).join(' ');
      if (r.ending) finishWithEnding(r.ending);
      if (host.onChange) host.onChange();
      render();
      return r;
    }
    function onNewsRead(key) { return after(E.onNewsRead(state(), key, day())); }
    function newsFor(d) { return E.newsFor(state(), d === undefined ? day() : d); }
    // Hinge: extra topics for this woman's chat, and what happens when one is picked.
    function hingeTopics(profile) { return E.hingeTopics(state(), profile); }
    function chooseHingeTopic(profile, topicId) { return after(E.chooseHinge(state(), profile, topicId, day())); }
    // Calls: quest topics for 'service:police' / 'service:newsroom' / 'service:university',
    // or a quest number ('pv:rosa' and so on, from contactForNumber).
    function serviceTopics(lineId) { return E.lineTopics(state(), lineId, day()).map(t => Object.assign({ pv: true }, t)); }
    function chooseServiceTopic(lineId, topicId) { return after(E.chooseLine(state(), lineId, topicId, day())); }
    function contactForNumber(number) { return E.contactForNumber(state(), String(number)); }

    function injectCss() {
      if (!doc || doc.getElementById('pv-css')) return;
      const st = doc.createElement('style');
      st.id = 'pv-css';
      st.textContent = `
.pv-case{padding:10px 12px;line-height:1.35;font-size:12px}
.pv-case .pv-hint{margin:8px 0;padding:6px 8px;border-left:3px solid #b8892a;background:#fff4d6;color:#4a3410;font-style:italic}.pv-case h3{margin:0 0 2px}.pv-case h4{margin:12px 0 4px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;opacity:.75}
.pv-sub,.pv-muted{opacity:.7;font-size:11px}
.pv-last{margin:8px 0;padding:7px 9px;border-left:3px solid #e35349;background:rgba(227,83,73,.1)}
.pv-btn{display:block;width:100%;margin:6px 0 0;padding:8px 9px;border-radius:7px;border:1px solid rgba(127,127,127,.5);background:rgba(127,127,127,.14);color:inherit;font:inherit;text-align:left;cursor:pointer}
.pv-btn small{display:block;opacity:.7;font-size:10px}.pv-btn:disabled{opacity:.45;cursor:default}
.pv-final{border-color:#e35349}
.pv-meter{display:grid;grid-template-columns:38% 1fr auto;gap:2px 6px;align-items:center;margin:6px 0}
.pv-meter i{display:block;height:7px;border-radius:4px;background:rgba(127,127,127,.25);overflow:hidden}.pv-meter b{display:block;height:100%;background:#4a8f6a}
.pv-meter em{font-style:normal;opacity:.75}.pv-meter small{grid-column:1/-1;opacity:.6;font-size:10px}.pv-danger b{background:#e35349}
.pv-list{margin:0;padding-left:16px}.pv-list li{margin:2px 0}
.pv-vm{margin:5px 0;padding:6px 8px;border-radius:6px;background:rgba(127,127,127,.12)}
.pv-inv{display:flex;gap:5px;flex-wrap:wrap}.pv-item{flex:1 1 52px;padding:5px;border-radius:6px;border:1px solid rgba(127,127,127,.4);text-align:center;font-size:10px}
.pv-item img{width:100%;max-height:40px;object-fit:contain;display:block}.pv-item small{display:block;opacity:.7}.pv-none{opacity:.5}
.pv-overlay{position:absolute;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,6,8,.92);background-size:cover;background-position:center;color:#ffe5c8;overflow:auto}
body>.pv-overlay{position:fixed}
.pv-panel{width:100%;max-width:340px;font-size:14px}.pv-panel h2{margin:0 0 8px}
.pv-note{display:flex;gap:8px;align-items:center;margin:8px 0}.pv-note img{width:60px;height:60px;object-fit:cover;border-radius:4px}
.pv-symbols{font-size:26px;letter-spacing:12px}
.pv-slots{display:flex;gap:6px;margin:10px 0}.pv-slot{flex:1;min-height:40px;border:2px dashed rgba(255,229,200,.5);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px}
.pv-tray{display:flex;gap:6px}.pv-tool{flex:1;padding:6px;border-radius:6px;border:1px solid rgba(255,229,200,.5);background:rgba(255,255,255,.06);color:inherit;font:inherit;cursor:pointer}
.pv-tool img{width:100%;max-height:48px;object-fit:contain;display:block}.pv-tool b{display:block;font-size:22px}.pv-tool:disabled{opacity:.3}
.pv-track{position:relative;height:28px;margin:10px 0;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden}
.pv-zone{position:absolute;top:0;bottom:0;background:rgba(74,143,106,.8)}.pv-needle{position:absolute;top:0;bottom:0;width:3px;margin-left:-1px;background:#ffe5c8}
.pv-hidden{display:none}.pv-foot{display:flex;gap:6px}.pv-foot .pv-btn{text-align:center}
.pv-kind{letter-spacing:.2em;font-size:11px;opacity:.85}.pv-art{width:100%;border-radius:8px;margin-bottom:10px}
.pv-complete .pv-kind{color:#9fe0b4}.pv-failure .pv-kind{color:#f0c27a}
.pv-seq{background:#0b0709;font-size:15px;text-align:center}.pv-scene-room-open{background:#1b1214}.pv-scene-figure{background:#000}.pv-scene-flash{background:#fff;color:#000}`;
      doc.head.appendChild(st);
    }

    return {
      engine: E, state, render, renderNotesPage, assembleFromParts,
      wireNeeded: () => E.wireNeeded(state()),
      wireFromFriend: name => after(E.wireFromFriend(state(), name, day())),
      onNewDay, onNewsRead, newsFor,
      hingeTopics, chooseHingeTopic,
      serviceTopics, chooseServiceTopic, contactForNumber,
      isOpen: () => state().stage !== 'dormant',
      // Vale rings you (the host's incoming-call screen): due, ring, answer, choices, choose, missed.
      valeCallerDue: () => (E.valeDue(state(), day()) ? 'x:vale' : E.fakeDue(state(), day()) ? 'x:pv-fake' : null),
      fakeCallCard: () => { const s = state(); return { name: DATA.tricks.fake.name, portrait: DATA.contacts.fake.portrait, number: s.numbers.fake || null }; },
      fakeRang: () => { E.fakeRang(state(), day()); if (host.save) host.save(); },
      fakeAnswer: () => E.fakeOpening(state()),
      fakeChoices: () => E.fakeCallChoices(state()),
      fakeChoose: id => after(E.fakeCallChoose(state(), id, day())),
      fakeMissed: () => { E.fakeMissed(state(), day()); if (host.save) host.save(); if (host.onChange) host.onChange(); render(); },
      valeCallCard: () => { const s = state(); const known = s.valeTalk1 || s.valeTalk2 || !!s.numbers.vale; return { name: known ? DATA.vale.name : 'Unknown number', portrait: known ? DATA.vale.portrait : DATA.contacts.rosa.portrait }; }, // a stranger until you know him
      valeRang: () => { E.valeRang(state(), day()); if (host.save) host.save(); },
      valeAnswer: () => E.valeOpening(state()),
      valeChoices: () => E.valeCallChoices(state()),
      valeChoose: id => after(E.valeCallChoose(state(), id, day())),
      valeMissed: () => { E.valeMissed(state(), day()); if (host.save) host.save(); if (host.onChange) host.onChange(); render(); },
      serviceGreeting: lineId => E.serviceGreeting(state(), lineId),
      // The world steps in (Chris, 4 November 2026): Rosa rings with the next piece of a stalled case.
      helpLead: () => E.helpLead(state()),
      helpGive: () => after(E.helpGive(state(), day())),
      helpText: key => DATA.help[key] || '',
      caseCard: () => { const v = E.caseFile(state(), day()); return { title: DATA.title, status: v.routeName, alert: v.todo[0] || '' }; }
    };
  }

  const API = { DATA, createEngine, mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.ProfessorVale = API;
})(typeof window !== 'undefined' ? window : globalThis);

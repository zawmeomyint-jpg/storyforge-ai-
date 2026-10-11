import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Aperture, LayoutDashboard, FolderOpen, AudioLines, Settings, Plus, Search,
  Bell, ChevronDown, Film, UploadCloud, Link2, Clock3, Languages, Sparkles,
  ScanSearch, BookOpenText, Mic2, CheckCircle2, Circle, ArrowRight, Play,
  Pause, Download, Copy, FileText, MoreHorizontal, SlidersHorizontal, WandSparkles,
  Clapperboard, FileVideo, X, Check, LoaderCircle, PanelLeftClose
} from 'lucide-react';
import './styles.css';

const initialScript = `ညရဲ့အမှောင်ထုက မြို့ငယ်လေးတစ်မြို့လုံးကို တဖြည်းဖြည်း လွှမ်းခြုံလာခဲ့တယ်။ အဲဒီညမှာတော့ သာမန်ညတစ်ညလို မဟုတ်ဘဲ လူတစ်ယောက်ရဲ့ဘဝကို အပြီးအပိုင် ပြောင်းလဲသွားစေမယ့် အဖြစ်အပျက်တစ်ခု စတင်တော့မှာပါ။

အိမ်ဟောင်းကြီးရဲ့ တံခါးကို သူ တိတ်တဆိတ် တွန်းဖွင့်လိုက်တယ်။ အတွင်းဘက်ကနေ လေစိမ်းတစ်ချက် တိုက်ခတ်လာပြီး ကြမ်းပြင်ပေါ်က ဖုန်မှုန့်တွေ လေထဲမှာ လွင့်ပျံသွားတယ်။ သူ ဒီနေရာကို ဘာကြောင့် ပြန်ရောက်လာတာလဲ။ ပြီးတော့ အခန်းထောင့်က အရိပ်တစ်ခုက ဘာကို စောင့်ကြည့်နေတာလဲ။

[ခေတ္တရပ် — ၁ စက္ကန့်]

သူ့လက်ထဲမှာ ဆုပ်ကိုင်ထားတဲ့ စာအိတ်ဟောင်းလေးကို ပြန်ကြည့်လိုက်တယ်။ အဲဒီစာအိတ်ထဲမှာ သူ့မိသားစုရဲ့ အတိတ်နဲ့ ပတ်သက်တဲ့ အဖြေတစ်ခု ရှိနေတယ်ဆိုတာ သူသိထားတယ်။ ဒါပေမဲ့ အဲဒီအဖြေကို ဖွင့်ကြည့်လိုက်တဲ့အခါ သူမျှော်လင့်ထားသလို ဖြစ်လာမှာ မဟုတ်ဘူး။

အခန်းထဲကို နောက်တစ်လှမ်း တိုးဝင်လိုက်တဲ့အချိန်မှာပဲ အပေါ်ထပ်ကနေ ခြေသံတစ်ခု ကြားလိုက်ရတယ်။ သူ ရပ်သွားတယ်။ အသက်ရှူသံကိုတောင် ထိန်းထားရင်း အပေါ်ကို မော့ကြည့်လိုက်တယ်။ အဲဒီအချိန်မှာ မီးရောင်က တစ်ချက် လင်းလိုက်၊ မှိန်သွားလိုက် ဖြစ်နေတယ်။`;

function App() {
  const [activeNav, setActiveNav] = useState('New Project');
  const [sourceMode, setSourceMode] = useState('link');
  const [videoUrl, setVideoUrl] = useState('');
  const [file, setFile] = useState(null);
  const [style, setStyle] = useState('hybrid');
  const [language, setLanguage] = useState('my');
  const [speed, setSpeed] = useState(1.2);
  const [duration, setDuration] = useState(90);
  const [script, setScript] = useState(initialScript);
  const [projectName, setProjectName] = useState('Untitled movie project');
  const [isEditingName, setIsEditingName] = useState(false);
  const [status, setStatus] = useState('ready');
  const [apiResult, setApiResult] = useState(null);
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('script');
  const [showSettings, setShowSettings] = useState(false);
  const [checked, setChecked] = useState([true, false, false]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const wordCount = useMemo(() => script.trim() ? script.trim().split(/\s+/).length : 0, [script]);
  const estimatedMinutes = useMemo(() => {
    const words = script.trim() ? script.trim().split(/\s+/).length : 0;
    return Math.max(1, Math.round(words / (145 * speed)));
  }, [script, speed]);

  const notify = (msg) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('video/')) {
      notify('Video ဖိုင်ကိုသာ ရွေးချယ်ပေးပါ။');
      return;
    }
    setFile(selected);
    setSourceMode('upload');
    setProjectName(selected.name.replace(/\.[^/.]+$/, ''));
    notify('Video ဖိုင်ကို ရွေးချယ်ပြီးပါပြီ။ AI analysis အတွက် backend ချိတ်ဆက်ရန် လိုအပ်ပါသည်။');
  };

  const analyze = async () => {
    if (sourceMode === 'link' && !videoUrl.trim()) {
      notify('Video Link ကို အရင်ထည့်ပေးပါ။');
      return;
    }
    if (sourceMode === 'upload' && !file) {
      notify('Video ဖိုင်ကို အရင် upload ရွေးချယ်ပေးပါ။');
      return;
    }
    setStatus('analyzing');
    setApiResult(null);
    try {
      const form = new FormData();
      if (sourceMode === 'upload' && file) form.append('video', file);
      if (sourceMode === 'link') form.append('videoUrl', videoUrl.trim());
      form.append('language', language);
      form.append('style', style);
      form.append('targetMinutes', String(duration));
      form.append('playbackSpeed', String(speed));
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/analyze`, {
        method: 'POST',
        body: form
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');
      setApiResult(data);
      if (data.script) setScript(data.script);
      if (data.projectName) setProjectName(data.projectName);
      notify('AI analysis ပြီးပါပြီ။ ရလဒ်ကို Script Editor မှာ ကြည့်နိုင်ပါတယ်။');
    } catch (err) {
      notify(err.message || 'Backend ကို ချိတ်ဆက်မရပါ။ Server ကို စတင်ထားခြင်းရှိမရှိ စစ်ဆေးပါ။');
    } finally {
      setStatus('ready');
    }
  };

  const generate = async () => {
    setStatus('generating');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/generate-script`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ script, language, style, targetMinutes: duration, playbackSpeed: speed })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed');
      if (data.script) setScript(data.script);
      notify('Script ကို ပြင်ဆင်ပြီးပါပြီ။');
    } catch (err) {
      notify(err.message || 'AI backend ကို ချိတ်ဆက်မရပါ။');
    } finally {
      setStatus('ready');
    }
  };

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(script);
      notify('Script ကို clipboard ထဲ ကူးယူပြီးပါပြီ။');
    } catch {
      notify('Copy မအောင်မြင်ပါ။ Script ကို ရွေးချယ်ပြီး ကိုယ်တိုင်ကူးယူပါ။');
    }
  };

  const downloadScript = () => {
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'storyforge-script'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Script file ကို download စတင်လိုက်ပါပြီ။');
  };

  return (
    <div className="app-shell">
      {sidebarOpen && <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Aperture size={22} strokeWidth={2.2}/></div>
          <div><div className="brand-name">STORYFORGE<span> AI</span></div><div className="brand-sub">CINEMATIC STUDIO</div></div>
          <button className="icon-btn sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar"><PanelLeftClose size={17}/></button>
        </div>
        <button className="workspace-select"><div className="workspace-icon"><Clapperboard size={16}/></div><div className="workspace-copy"><b>My Workspace</b><span>Free workspace</span></div><ChevronDown size={15}/></button>
        <div className="nav-label">WORKSPACE</div>
        <nav className="nav">
          {[
            {name:'Dashboard', icon:LayoutDashboard},
            {name:'New Project', icon:Plus},
            {name:'My Scripts', icon:FolderOpen},
            {name:'Voice Studio', icon:AudioLines}
          ].map(item => <button key={item.name} className={`nav-item ${activeNav===item.name?'active':''}`} onClick={() => {setActiveNav(item.name); if(item.name==='Voice Studio') setTab('voice'); else if(item.name==='My Scripts') setTab('script');}}>
            <item.icon size={18}/><span>{item.name}</span>{item.name==='My Scripts' && <span className="nav-count">3</span>}
          </button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="usage-card">
            <div className="usage-top"><span>Monthly usage</span><span>12%</span></div>
            <div className="usage-track"><div className="usage-fill"/></div>
            <p>You've used 12 of 100 AI minutes.</p>
            <button onClick={() => notify('Plan management ကို backend ချိတ်ဆက်ပြီးမှ ဖွင့်နိုင်ပါမယ်။')}>Explore plans <ArrowRight size={13}/></button>
          </div>
          <button className={`nav-item ${activeNav==='Settings'?'active':''}`} onClick={() => {setActiveNav('Settings'); setShowSettings(!showSettings);}}><Settings size={18}/><span>Settings</span></button>
          <div className="profile-row"><div className="avatar">SF</div><div className="profile-copy"><b>Story Creator</b><span>Free plan</span></div><MoreHorizontal size={18}/></div>
        </div>
      </aside>}

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs">
            {!sidebarOpen && <button className="icon-btn" onClick={() => setSidebarOpen(true)}><Aperture size={19}/></button>}
            <span>Workspace</span><span className="crumb-slash">/</span><b>{activeNav}</b>
          </div>
          <div className="top-actions">
            <div className="status-pill"><span className="green-dot"/> All systems normal</div>
            <button className="icon-btn" aria-label="Search" onClick={() => notify('Search ကို မကြာမီ ထည့်သွင်းပေးပါမယ်။')}><Search size={18}/></button>
            <button className="icon-btn notification" aria-label="Notifications" onClick={() => notify('လက်ရှိ notification မရှိသေးပါ။')}><Bell size={18}/><i/></button>
            <div className="top-avatar">SC</div>
          </div>
        </header>

        <div className="content">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line"/> AI STORYTELLING WORKSPACE</div>
              <h1>Bring every story <span>to life.</span></h1>
              <p className="heading-sub">သင့် Movie ကို အသေးစိတ်၊ ရုပ်ရှင်ဆန်ဆန် မြန်မာ Storytelling Script အဖြစ် ပြောင်းလဲပါ။</p>
            </div>
            <div className="heading-badge"><Sparkles size={15}/> Built for long-form narration</div>
          </section>

          <section className="stepper">
            {[
              {n:'01',title:'Add your movie',sub:'Link or upload',icon:Film},
              {n:'02',title:'Analyze scenes',sub:'Understand the story',icon:ScanSearch},
              {n:'03',title:'Craft your script',sub:'Voice-over ready',icon:BookOpenText}
            ].map((s,i) => <React.Fragment key={s.n}>
              <div className={`step ${i===0?'step-current':''}`}>
                <div className="step-icon">{status==='analyzing' && i===1 ? <LoaderCircle className="spin" size={18}/> : <s.icon size={18}/>}</div>
                <div className="step-text"><b>{s.title}</b><span>{s.sub}</span></div>
                <span className="step-number">{s.n}</span>
              </div>
              {i<2 && <div className="step-connector"/>}
            </React.Fragment>)}
          </section>

          <div className="workspace-grid">
            <div className="left-column">
              <section className="panel source-panel">
                <div className="panel-header">
                  <div className="panel-title-wrap"><div className="panel-icon amber"><Film size={18}/></div><div><h2>Movie source</h2><p>Start with a link or upload your video file</p></div></div>
                  <span className="step-tag">STEP 01</span>
                </div>
                <div className="source-tabs">
                  <button className={sourceMode==='link'?'selected':''} onClick={() => setSourceMode('link')}><Link2 size={15}/> Video link</button>
                  <button className={sourceMode==='upload'?'selected':''} onClick={() => setSourceMode('upload')}><UploadCloud size={15}/> Upload file</button>
                </div>
                {sourceMode==='link' ? <div className="url-input-wrap"><Link2 size={17}/><input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="Paste a YouTube or video URL here..." /><button className="input-clear" onClick={()=>setVideoUrl('')}><X size={15}/></button></div> :
                  <label className={`upload-zone ${file?'has-file':''}`}>
                    <input type="file" accept="video/*" onChange={handleFile} hidden/>
                    {file ? <><div className="upload-icon success"><Check size={22}/></div><b>{file.name}</b><span>{(file.size/1024/1024).toFixed(1)} MB · Selected</span><em>Click to choose another file</em></> : <><div className="upload-icon"><UploadCloud size={22}/></div><b>Drop your movie file here</b><span>or click to browse your files</span><em>MP4, MOV, MKV · Max size depends on server configuration</em></>}
                  </label>}
                <div className="source-foot"><span><CheckCircle2 size={14}/> Your projects stay in your workspace</span><span><Clock3 size={14}/> Long videos may take time</span></div>
                <button className="primary-btn full-btn" onClick={analyze} disabled={status==='analyzing'}>{status==='analyzing'?<><LoaderCircle className="spin" size={17}/> Checking source...</>:<><ScanSearch size={17}/> Analyze movie <ArrowRight size={16}/></>}</button>
                <p className="disclaimer">Video uploads are processed by your configured backend. Use only videos you have rights or permission to process.</p>
              </section>

              <section className="panel settings-panel">
                <div className="panel-header">
                  <div className="panel-title-wrap"><div className="panel-icon purple"><WandSparkles size={18}/></div><div><h2>Storytelling settings</h2><p>Shape the tone, language, and narration pace</p></div></div>
                  <button className="text-action" onClick={() => {setStyle('hybrid');setLanguage('my');setSpeed(1.2);setDuration(90);notify('Default settings ပြန်ထားပြီးပါပြီ။')}}>Reset defaults</button>
                </div>
                <div className="field-label">NARRATION STYLE</div>
                <div className="style-options">
                  <button className={`style-option ${style==='detailed'?'chosen':''}`} onClick={()=>setStyle('detailed')}><div className="style-symbol"><BookOpenText size={17}/></div><div><b>Detailed</b><span>Scene-by-scene clarity</span></div>{style==='detailed'&&<CheckCircle2 size={16} className="chosen-check"/>}</button>
                  <button className={`style-option ${style==='cinematic'?'chosen':''}`} onClick={()=>setStyle('cinematic')}><div className="style-symbol"><Clapperboard size={17}/></div><div><b>Cinematic</b><span>Emotion & suspense</span></div>{style==='cinematic'&&<CheckCircle2 size={16} className="chosen-check"/>}</button>
                  <button className={`style-option ${style==='hybrid'?'chosen':''}`} onClick={()=>setStyle('hybrid')}><div className="style-symbol hybrid-symbol"><Sparkles size={17}/></div><div><b>Hybrid <span className="recommended">RECOMMENDED</span></b><span>Detail with dramatic flow</span></div>{style==='hybrid'&&<CheckCircle2 size={16} className="chosen-check"/>}</button>
                </div>
                <div className="settings-row">
                  <label className="setting-field"><span className="field-label">SCRIPT LANGUAGE</span><div className="select-wrap"><Languages size={16}/><select value={language} onChange={e=>setLanguage(e.target.value)}><option value="my">မြန်မာ (Burmese)</option><option value="en">English</option><option value="both">Burmese + English</option></select><ChevronDown size={14}/></div></label>
                  <label className="setting-field"><span className="field-label">TARGET LENGTH</span><div className="select-wrap"><Clock3 size={16}/><select value={duration} onChange={e=>setDuration(Number(e.target.value))}><option value={30}>30 minutes</option><option value={60}>60 minutes</option><option value={90}>90 minutes</option><option value={120}>120 minutes</option></select><ChevronDown size={14}/></div></label>
                </div>
                <div className="speed-setting"><div><span className="field-label">VOICEOVER PLAYBACK SPEED</span><p>Optimize script length for your TTS speed</p></div><div className="speed-control"><button onClick={()=>setSpeed(s=>Math.max(0.8,+(s-0.1).toFixed(1)))} aria-label="Decrease speed">−</button><b>{speed.toFixed(1)}×</b><button onClick={()=>setSpeed(s=>Math.min(2,+(s+0.1).toFixed(1)))} aria-label="Increase speed">+</button></div></div>
                <div className="quality-note"><Sparkles size={15}/><span><b>Smart pacing enabled</b> — scene transitions, emotional pauses, and natural Burmese phrasing.</span></div>
              </section>
            </div>

            <div className="right-column">
              <section className="panel progress-panel">
                <div className="panel-header compact-header"><div><h2>Project overview</h2><p>Your storytelling at a glance</p></div><button className="icon-btn small" onClick={()=>notify('Project overview options')}><MoreHorizontal size={18}/></button></div>
                <div className="project-title"><div className="project-poster"><Film size={24}/><span>STORY<br/>PROJECT</span></div><div className="project-meta"><span className="project-label">CURRENT PROJECT</span>{isEditingName?<input className="rename-input" value={projectName} onChange={e=>setProjectName(e.target.value)} onBlur={()=>setIsEditingName(false)} autoFocus/>:<b onClick={()=>setIsEditingName(true)} title="Click to rename">{projectName || 'Untitled movie project'} <span className="edit-hint">✎</span></b>}<span className="project-status"><i/> Draft project</span></div></div>
                <div className="metrics-grid"><div className="metric"><span>Target runtime</span><b>{duration} <small>min</small></b><span className="metric-foot">at {speed.toFixed(1)}× playback</span></div><div className="metric"><span>Script words</span><b>{wordCount.toLocaleString()}</b><span className="metric-foot">in current draft</span></div></div>
                {apiResult && <div className="api-result"><b>Latest analysis</b><span>{apiResult.sceneCount || 0} sampled scenes · {apiResult.transcriptAvailable ? 'Audio transcript found' : 'No transcript returned'}</span></div>}
                <div className="progress-divider"/>
                <div className="checklist-title">WORKFLOW CHECKLIST <span>1 of 3</span></div>
                <div className="checklist">{['Add movie source','Analyze scenes','Generate full script'].map((item,i)=><button key={item} onClick={()=>setChecked(old=>old.map((v,j)=>j===i?!v:v))} className="check-row">{checked[i]?<CheckCircle2 size={17} className="check-done"/>:<Circle size={17} className="check-empty"/>}<span>{item}</span>{i===0&&file||i===0&&videoUrl?<span className="mini-done">Added</span>:null}</button>)}</div>
              </section>

              <section className="panel output-panel">
                <div className="panel-header compact-header"><div className="panel-title-wrap"><div className="panel-icon green"><FileText size={17}/></div><div><h2>Script workspace</h2><p>Edit and export your narration</p></div></div><span className="draft-badge">SAMPLE DRAFT</span></div>
                <div className="output-tabs"><button className={tab==='script'?'active':''} onClick={()=>setTab('script')}><FileText size={15}/> Script</button><button className={tab==='voice'?'active':''} onClick={()=>setTab('voice')}><Mic2 size={15}/> Voice cues</button></div>
                {tab==='script' ? <><div className="script-toolbar"><span><span className="live-dot"/> Editable text</span><div><button onClick={copyScript}><Copy size={14}/> Copy</button><button onClick={downloadScript}><Download size={14}/> Export</button></div></div><textarea className="script-editor" value={script} onChange={e=>setScript(e.target.value)} spellCheck="false" aria-label="Editable storytelling script"/><div className="script-footer"><span>{wordCount.toLocaleString()} words</span><span>Est. {estimatedMinutes} min at {speed.toFixed(1)}×</span></div></> :
                  <div className="voice-cues"><div className="cue"><span className="cue-tag pause">PAUSE</span><div><b>ခေတ္တရပ် — ၁ စက္ကန့်</b><p>အရေးကြီးတဲ့ reveal မတိုင်ခင် အနည်းငယ် ရပ်ပါ။</p></div></div><div className="cue"><span className="cue-tag emotion">EMOTION</span><div><b>စိတ်လှုပ်ရှားမှုကို တဖြည်းဖြည်းမြှင့်ပါ</b><p>Suspense ရှိတဲ့အပိုင်းမှာ စကားပြောနှုန်းကို အနည်းငယ်လျှော့ပါ။</p></div></div><div className="cue"><span className="cue-tag tone">TONE</span><div><b>တည်ငြိမ်ပြီး သဘာဝကျသောအသံ</b><p>စာကြောင်းတိုင်းကို သီးခြားမဖတ်ဘဲ အကြောင်းအရာဆက်စပ်မှုကို ထိန်းထားပါ။</p></div></div></div>}
                <button className="primary-btn generate-btn" onClick={generate} disabled={status==='generating'}>{status==='generating'?<><LoaderCircle className="spin" size={16}/> Preparing...</>:<><Sparkles size={16}/> Generate full script <ArrowRight size={15}/></>}</button>
                <p className="editor-note"><i/> AI features require a configured API key and FFmpeg on the server. Long-video results depend on processing limits.</p>
              </section>
            </div>
          </div>
          <footer className="page-footer"><span>© 2025 StoryForge AI</span><span><span className="green-dot"/> Your creative workspace</span><span>Made for storytellers <span className="heart">♥</span></span></footer>
        </div>
      </main>
      {notice && <div className="toast"><CheckCircle2 size={17}/><span>{notice}</span><button onClick={()=>setNotice('')}><X size={15}/></button></div>}
      {showSettings && <div className="settings-popover"><button className="popover-close" onClick={()=>setShowSettings(false)}><X size={15}/></button><b>Workspace settings</b><p>Language: Burmese</p><p>Mode: Demo frontend</p><p>AI backend: Not connected</p><span>Connect an AI API and video processing service to enable real analysis.</span></div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
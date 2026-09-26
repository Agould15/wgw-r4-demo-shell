(() => {
const q=s=>document.querySelector(s), items=window.WGW_VIGNETTES||[], body=document.body, stage=q("#stage"), launcher=q("#launcher"), drawer=q("#drawer"), list=q("#vignetteList"), video=q("#video"), poster=q("#poster"), status=q("#status");
const play=q("#playPause"), restart=q("#restart"), mute=q("#mute"), now=q("#timeNow"), total=q("#timeTotal"), kicker=q("#clipKicker"), title=q("#clipTitle");
let ct, st;
const fmt=s=>Number.isFinite(s)?`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`:"0:00";
const openDrawer=open=>{if(open&&!video.paused)video.pause();body.classList.toggle("drawer-open",open);drawer.setAttribute("aria-hidden",String(!open));launcher.setAttribute("aria-expanded",String(open));};
const msg=(m,ms=2600)=>{clearTimeout(st);status.textContent=m;status.classList.add("show");st=setTimeout(()=>status.classList.remove("show"),ms);};
const active=id=>document.querySelectorAll(".vignette-card").forEach(el=>el.classList.toggle("active",el.dataset.id===id));
function posterOnly(item){video.pause();video.removeAttribute("src");video.load();video.style.display="none";poster.src=item.poster;poster.style.display="block";play.textContent="▶";now.textContent=total.textContent="0:00";}
function select(item){active(item.id);kicker.textContent=item.kicker||"";title.textContent=item.title;poster.src=item.poster;poster.style.display="block";video.style.display="none";openDrawer(false);video.src=item.video;video.load();
const ok=async()=>{poster.style.display="none";video.style.display="block";try{await video.play()}catch{msg("Ready. Press Space or Play.")}};
const bad=()=>{posterOnly(item);msg(`Video not found yet: ${item.video}`,4200)};
video.addEventListener("canplay",ok,{once:true});video.addEventListener("error",bad,{once:true});}
items.forEach(item=>{const b=document.createElement("button");b.className="vignette-card";b.dataset.id=item.id;const fc=item.badge==="FUTURE"?" future":"";b.innerHTML=`<div class="vignette-topline"><div class="vignette-title">${item.title}</div>${item.badge?`<span class="badge${fc}">${item.badge}</span>`:""}</div><div class="vignette-desc">${item.description}</div>`;b.onclick=()=>select(item);list.appendChild(b)});
launcher.onclick=()=>openDrawer(!body.classList.contains("drawer-open"));q("#closeDrawer").onclick=()=>openDrawer(false);
function toggle(){if(!video.src||video.style.display==="none"){msg("No video loaded for this vignette yet.");return}video.paused?video.play():video.pause()}
play.onclick=toggle;restart.onclick=()=>{if(video.src&&video.style.display!=="none"){video.currentTime=0;video.play()}};
mute.onclick=()=>{video.muted=!video.muted;mute.textContent=video.muted?"🔇":"🔊"};
video.onplay=()=>play.textContent="❚❚";video.onpause=()=>play.textContent="▶";video.onloadedmetadata=()=>total.textContent=fmt(video.duration);video.ontimeupdate=()=>now.textContent=fmt(video.currentTime);video.onended=()=>msg("Clip complete — holding final frame.");
stage.onmousemove=()=>{stage.classList.add("controls-visible");clearTimeout(ct);ct=setTimeout(()=>stage.classList.remove("controls-visible"),1800)};
document.onkeydown=e=>{if(e.code==="Space"){e.preventDefault();toggle()}else if(e.key.toLowerCase()==="r"){restart.click()}else if(e.key.toLowerCase()==="m"){mute.click()}else if(e.key==="Escape"){openDrawer(false)}};
if(items[0]){active(items[0].id);kicker.textContent="WHAT GETS WET";title.textContent="Context in Action";poster.src="assets/posters/regional-context.png";poster.alt="What Gets Wet regional context"}
})();

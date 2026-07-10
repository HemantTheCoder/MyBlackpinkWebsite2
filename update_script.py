import sys

with open(r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Update initAll
old_init = '''function initAll() {
  initMusicPlayer();
  initPhotocards();
  initFanArt();
  initVault();
  initProfile();
}'''
new_init = '''function initAll() {
  initMusicPlayer();
  initPhotocards();
  initFanArt();
  initVault();
  initProfile();
  
  if (typeof initSongOfDay === 'function') initSongOfDay();
  if (typeof initMascot === 'function') initMascot();
  if (typeof initCursorTrail === 'function') initCursorTrail();
}'''
content = content.replace(old_init, new_init)

# Remove PWA Banner calls from initProfile
content = content.replace('setTimeout(showPWABanner, 3000);', '// setTimeout(showPWABanner, 3000);')

# Add foil pack animation
old_pull = '''  pullBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(API_BASE + '/api/pull', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('user_token') }
      });
      const data = await res.json();
      if (res.ok) {
        document.getElementById('pulled-card-img').src = data.card.url;
        document.getElementById('pulled-card-rarity').textContent = data.card.rarity;
        document.getElementById('pulled-card-rarity').className = 'card-rarity ' + data.card.rarity.toLowerCase();
        
        const dupMsg = document.getElementById('duplicate-msg');
        const pullMsg = document.getElementById('pull-status-msg');
        if (dupMsg && pullMsg) {
          if (data.isDuplicate) {
            dupMsg.style.display = 'block';
            pullMsg.style.display = 'none';
          } else {
            dupMsg.style.display = 'none';
            pullMsg.style.display = 'block';
          }
        }
        
        if (data.card.rarity.toLowerCase() === 'legendary') {
          reveal.classList.add('reveal-anim', 'legendary');
        } else {
          reveal.classList.remove('reveal-anim', 'legendary');
        }
        
        if (data.user) {
          currentUser = data.user;
          localStorage.setItem('bp_user', JSON.stringify(currentUser));
        } else {
          if(!currentUser.photocards) currentUser.photocards = [];
          currentUser.photocards.push(data.card);
          currentUser.lastPullDate = new Date().toDateString();
          localStorage.setItem('bp_user', JSON.stringify(currentUser));
        }
        
        if(window.triggerConfetti) window.triggerConfetti();
        window.updatePhotocardUI();
      } else {
        const cd = document.getElementById('pull-countdown');
        if (cd) {
           cd.style.display = 'block';
           cd.style.color = '#ff6666';
           cd.innerHTML = data.error || 'Failed to pull card';
        } else {
           alert(data.error || 'Failed to pull card');
        }
      }
    } catch(e) {
      alert('Error pulling card: ' + e.message);
    }
  });'''

new_pull = '''  pullBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(API_BASE + '/api/pull', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('user_token') }
      });
      const data = await res.json();
      if (res.ok) {
        // FOIL PACK ANIMATION
        reveal.style.display = 'none';
        
        let packAnim = document.getElementById('foil-pack-anim');
        if (!packAnim) {
          packAnim = document.createElement('div');
          packAnim.id = 'foil-pack-anim';
          packAnim.style.position = 'fixed';
          packAnim.style.top = '0';
          packAnim.style.left = '0';
          packAnim.style.width = '100vw';
          packAnim.style.height = '100vh';
          packAnim.style.backgroundColor = 'rgba(0,0,0,0.9)';
          packAnim.style.zIndex = '9999';
          packAnim.style.display = 'flex';
          packAnim.style.flexDirection = 'column';
          packAnim.style.alignItems = 'center';
          packAnim.style.justifyContent = 'center';
          
          const pack = document.createElement('div');
          pack.id = 'bp-pack';
          pack.style.width = '200px';
          pack.style.height = '300px';
          pack.style.background = 'linear-gradient(135deg, #ff2a85 0%, #000 100%)';
          pack.style.border = '2px solid #ff8fab';
          pack.style.borderRadius = '15px';
          pack.style.boxShadow = '0 0 30px rgba(255,105,180,0.8), inset 0 0 20px rgba(255,255,255,0.2)';
          pack.style.display = 'flex';
          pack.style.alignItems = 'center';
          pack.style.justifyContent = 'center';
          pack.style.color = 'white';
          pack.style.fontSize = '1.5rem';
          pack.style.fontWeight = 'bold';
          pack.style.textShadow = '0 0 10px white';
          pack.style.cursor = 'pointer';
          pack.style.transition = 'all 0.3s';
          pack.innerHTML = 'TAP TO<br>TEAR OPEN';
          
          const clickText = document.createElement('div');
          clickText.textContent = "(Click the pack!)";
          clickText.style.color = '#aaa';
          clickText.style.marginTop = '20px';
          
          packAnim.appendChild(pack);
          packAnim.appendChild(clickText);
          document.body.appendChild(packAnim);
        }
        
        packAnim.style.display = 'flex';
        const pack = document.getElementById('bp-pack');
        const clickText = packAnim.children[1];
        clickText.style.display = 'block';
        
        pack.onclick = function() {
          pack.onclick = null;
          clickText.style.display = 'none';
          
          const rarity = data.card.rarity.toLowerCase();
          if (rarity === 'legendary') pack.style.boxShadow = '0 0 60px #ffd700, inset 0 0 30px #ffd700';
          else if (rarity === 'epic') pack.style.boxShadow = '0 0 50px #ff6b9e, inset 0 0 20px #ff6b9e';
          else if (rarity === 'rare') pack.style.boxShadow = '0 0 40px #4287f5, inset 0 0 15px #4287f5';
          else pack.style.boxShadow = '0 0 30px #aaa, inset 0 0 10px #aaa';

          pack.classList.add('shake-anim');
          
          setTimeout(() => {
            pack.classList.remove('shake-anim');
            pack.classList.add('burst-anim');
            
            setTimeout(() => {
              packAnim.style.display = 'none';
              reveal.style.display = 'block';
            
              document.getElementById('pulled-card-img').src = data.card.url;
              document.getElementById('pulled-card-rarity').textContent = data.card.rarity;
              document.getElementById('pulled-card-rarity').className = 'card-rarity ' + data.card.rarity.toLowerCase();
              
              const dupMsg = document.getElementById('duplicate-msg');
              const pullMsg = document.getElementById('pull-status-msg');
              if (dupMsg && pullMsg) {
                if (data.isDuplicate) {
                  dupMsg.style.display = 'block';
                  pullMsg.style.display = 'none';
                } else {
                  dupMsg.style.display = 'none';
                  pullMsg.style.display = 'block';
                }
              }
              
              if (data.card.rarity.toLowerCase() === 'legendary') {
                reveal.classList.add('reveal-anim', 'legendary');
              } else {
                reveal.classList.remove('reveal-anim', 'legendary');
              }
              
              if (data.user) {
                currentUser = data.user;
                localStorage.setItem('bp_user', JSON.stringify(currentUser));
              } else {
                if(!currentUser.photocards) currentUser.photocards = [];
                currentUser.photocards.push(data.card);
                currentUser.lastPullDate = new Date().toDateString();
                localStorage.setItem('bp_user', JSON.stringify(currentUser));
              }
              
              if(window.triggerConfetti) window.triggerConfetti();
              if(window.addEXP) window.addEXP(25, 'Pulled a photocard!');
              window.updatePhotocardUI();
            }, 500); // end inner setTimeout
          }, 1500); // end middle setTimeout
        }; // end onclick function
      } else {
        const cd = document.getElementById('pull-countdown');
        if (cd) {
           cd.style.display = 'block';
           cd.style.color = '#ff6666';
           cd.innerHTML = data.error || 'Failed to pull card';
        } else {
           alert(data.error || 'Failed to pull card');
        }
      }
    } catch(e) {
      alert('Error pulling card: ' + e.message);
    }
  });'''
content = content.replace(old_pull, new_pull)

with open(r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated initAll and pullCard successfully")

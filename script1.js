document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('startModal');
  const btn = document.getElementById('startBtn');
  const music = document.getElementById('bgMusic');
  const soundBtn = document.getElementById('soundBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const galaxyUI = document.getElementById('galaxyUI');
  const pageLoader = document.getElementById('pageLoader');
  const loadingStartedAt = performance.now();

  let galaxyController = null;
  let galaxyReady = false;
  let pageReady = document.readyState === 'complete';

  function revealIntroWhenReady() {
    if (!galaxyReady || !pageReady) return;

    const wait = Math.max(
      0,
      450 - (performance.now() - loadingStartedAt)
    );

    setTimeout(function() {
      document.body.classList.remove('app-loading');

      setTimeout(function() {
        if (pageLoader) {
          pageLoader.classList.add('is-hidden');

          setTimeout(function() {
            pageLoader.remove();
          }, 600);
        }
      }, 350);
    }, wait);
  }

  if (!pageReady) {
    window.addEventListener('load', function() {
      pageReady = true;
      revealIntroWhenReady();
    }, { once: true });
  }

  if (music && soundBtn) {
    soundBtn.addEventListener('click', function() {
      music.muted = !music.muted;

      soundBtn.classList.toggle(
        'is-muted',
        music.muted
      );

      soundBtn.setAttribute(
        'aria-label',
        music.muted
          ? 'Activar música'
          : 'Silenciar música'
      );
    });
  } else if (soundBtn) {
    soundBtn.style.display = 'none';
  }

  function updateFullscreenButton() {
    const isFullscreen = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement
    );

    if (fullscreenBtn) {
      fullscreenBtn.classList.toggle(
        'is-active',
        isFullscreen
      );

      fullscreenBtn.setAttribute(
        'aria-label',
        isFullscreen
          ? 'Salir de pantalla completa'
          : 'Activar pantalla completa'
      );

      fullscreenBtn.setAttribute(
        'title',
        isFullscreen
          ? 'Salir de pantalla completa'
          : 'Activar pantalla completa'
      );
    }
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', function() {
      const page = document.documentElement;

      const isFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement;

      try {
        const action = isFullscreen
          ? (
              document.exitFullscreen
                ? document.exitFullscreen()
                : document.webkitExitFullscreen()
            )
          : (
              page.requestFullscreen
                ? page.requestFullscreen()
                : page.webkitRequestFullscreen()
            );

        if (
          action &&
          typeof action.catch === 'function'
        ) {
          action.catch(function() {});
        }
      } catch (_) {}
    });

    document.addEventListener(
      'fullscreenchange',
      updateFullscreenButton
    );

    document.addEventListener(
      'webkitfullscreenchange',
      updateFullscreenButton
    );
  }

  if (btn) {
    btn.addEventListener('click', function() {
      btn.disabled = true;

      if (music) {
        music.volume = 0.7;
        music.muted = false;

        const playPromise = music.play();

        if (playPromise !== undefined) {
          playPromise.catch(function(error) {
            console.warn(
              'No se pudo iniciar la música:',
              error
            );
          });
        }
      }

      if (
        galaxyController &&
        typeof galaxyController.startCinematic === 'function'
      ) {
        galaxyController.startCinematic();
      }

      if (modal) {
        modal.classList.add('is-leaving');

        setTimeout(function() {
          modal.style.display = 'none';
        }, 900);
      }

      document.body.classList.add('galaxy-started');

      if (galaxyUI) {
        galaxyUI.setAttribute(
          'aria-hidden',
          'false'
        );

        galaxyUI.style.display = 'block';
        galaxyUI.style.visibility = 'visible';
        galaxyUI.style.opacity = '1';
      }

      setTimeout(function() {
        document.body.classList.remove(
          'galaxy-started'
        );

        document.body.classList.add(
          'garden-visible'
        );

        if (galaxyUI) {
          galaxyUI.setAttribute(
            'aria-hidden',
            'false'
          );

          galaxyUI.style.display = 'block';
          galaxyUI.style.visibility = 'visible';
          galaxyUI.style.opacity = '1';
        }
      }, 5000);
    });
  }

  requestAnimationFrame(function() {
    runGalaxy({
      onReady: function(controller) {
        galaxyController = controller;
        galaxyReady = true;
        revealIntroWhenReady();
      }
    });
  });

  function runGalaxy(opts = {}) {
    const err = document.getElementById('err');

    function showError(msg) {
      if (err) {
        err.textContent = msg;
        err.style.display = 'block';
      } else {
        console.error(msg);
      }
    }

    let readyDelivered = false;

    function deliverReady(controller) {
      if (readyDelivered) return;

      readyDelivered = true;

      if (typeof opts.onReady === 'function') {
        opts.onReady(controller);
      }
    }

    try {
      const testCanvas = document.createElement('canvas');

      const test =
        testCanvas.getContext('webgl') ||
        testCanvas.getContext('experimental-webgl');

      if (!test) {
        throw new Error(
          'Tu navegador no tiene WebGL activo'
        );
      }
    } catch (e) {
      showError(
        'WebGL parece desactivado. Prueba con Chrome, Edge o Firefox, o habilita la aceleración por hardware.'
      );

      deliverReady({
        startCinematic: function() {}
      });

      return;
    }

    try {
      const canvas = document.getElementById(
        'galaxy-canvas'
      );

      if (!canvas) {
        throw new Error(
          'No se encontró el canvas galaxy-canvas'
        );
      }

      if (typeof THREE === 'undefined') {
        throw new Error(
          'Three.js no está cargado'
        );
      }

      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false
      });

      const maxPixelRatio =
        window.innerWidth < 700
          ? 1.5
          : 1.75;

      renderer.setPixelRatio(
        Math.min(
          maxPixelRatio,
          window.devicePixelRatio || 1
        )
      );

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );

      if (
        'outputEncoding' in renderer &&
        typeof THREE.sRGBEncoding !== 'undefined'
      ) {
        renderer.outputEncoding =
          THREE.sRGBEncoding;
      }

      const scene = new THREE.Scene();

      let backgroundReady = false;

      const loadingManager =
        new THREE.LoadingManager();

      loadingManager.onLoad = function() {
        requestAnimationFrame(function() {
          deliverReady(galaxyApi);
        });
      };

      const spaceBackgroundLoader =
        new THREE.CubeTextureLoader(
          loadingManager
        );

      if (
        window.ROMANTIC_SPACE_BG_FACES &&
        Array.isArray(
          window.ROMANTIC_SPACE_BG_FACES
        )
      ) {
        spaceBackgroundLoader.load(
          window.ROMANTIC_SPACE_BG_FACES,
          function(spaceBackground) {
            if (
              typeof THREE.sRGBEncoding !== 'undefined'
            ) {
              spaceBackground.encoding =
                THREE.sRGBEncoding;
            }

            scene.background =
              spaceBackground;

            backgroundReady = true;
            cinematicStart = null;
          },
          undefined,
          function() {
            backgroundReady = true;
          }
        );
      } else {
        backgroundReady = true;
      }

      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth /
          window.innerHeight,
        0.1,
        2000
      );

      let controls = null;

      if (
        typeof THREE.OrbitControls === 'function'
      ) {
        controls = new THREE.OrbitControls(
          camera,
          renderer.domElement
        );
      } else if (
        typeof OrbitControls === 'function'
      ) {
        controls = new OrbitControls(
          camera,
          renderer.domElement
        );
      } else {
        throw new Error(
          'OrbitControls no está cargado'
        );
      }

      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 10;
      controls.maxDistance = 220;
      controls.target.set(0, 0, 0);

      let cinematicState = null;
      let cinematicStart = null;

      let cinematicDuration1 = 1.4;
      let cinematicDuration2 = 2.2;
      let cinematicDuration3 = 1.4;

      let cinematicTotal =
        cinematicDuration1 +
        cinematicDuration2 +
        cinematicDuration3;

      const galaxyApi = {
        startCinematic: function() {
          cinematicState = 0;
          cinematicStart = null;
          controls.enabled = false;
        }
      };

      function setCam() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const isMobile =
          w < 768 || w < h;

        camera.fov = isMobile
          ? 90
          : 75;

        camera.position.set(
          0,
          isMobile ? 26 : 22,
          isMobile ? 110 : 75
        );

        camera.updateProjectionMatrix();
        controls.update();
      }

      setCam();

      function resizeGalaxy() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect =
          width / height;

        camera.updateProjectionMatrix();

        renderer.setPixelRatio(
          Math.min(
            maxPixelRatio,
            window.devicePixelRatio || 1
          )
        );

        renderer.setSize(
          width,
          height,
          false
        );
      }

      window.addEventListener(
        'resize',
        resizeGalaxy
      );

      renderer.setClearColor(
        0x0a0800,
        1
      );

      const explosions = [];

      function spawnExplosion() {
        const geo =
          new THREE.PlaneGeometry(
            60,
            60
          );

        const c =
          document.createElement('canvas');

        c.width = 256;
        c.height = 256;

        const g =
          c.getContext('2d');

        const grad =
          g.createRadialGradient(
            128,
            128,
            10,
            128,
            128,
            128
          );

        grad.addColorStop(
          0,
          'rgba(255,255,200,0.85)'
        );

        grad.addColorStop(
          0.2,
          'rgba(255,200,50,0.45)'
        );

        grad.addColorStop(
          0.5,
          'rgba(255,150,0,0.18)'
        );

        grad.addColorStop(
          1,
          'rgba(0,0,0,0)'
        );

        g.fillStyle = grad;
        g.fillRect(
          0,
          0,
          256,
          256
        );

        const tex =
          new THREE.CanvasTexture(c);

        const mat =
          new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            depthWrite: false,
            blending:
              THREE.AdditiveBlending
          });

        const mesh =
          new THREE.Mesh(
            geo,
            mat
          );

        const angle =
          Math.random() *
          Math.PI *
          2;

        const dist =
          70 +
          Math.random() *
          60;

        mesh.position.set(
          Math.cos(angle) * dist,
          (Math.random() - 0.5) * 40,
          Math.sin(angle) * dist
        );

        mesh.lookAt(0, 0, 0);

        mesh.material.opacity =
          0.85;

        mesh.userData.life =
          1.0;

        explosions.push(mesh);
        scene.add(mesh);
      }

      setInterval(function() {
        if (Math.random() < 0.85) {
          spawnExplosion();
        }
      }, 700);

      const galaxy =
        new THREE.Group();

      scene.add(galaxy);

      const CFG =
        window.GALAXIA_INFINITA_DATA ||
        {};

      const phrases =
        Array.isArray(CFG.phrases) &&
        CFG.phrases.length
          ? CFG.phrases
          : [
              'Eres preciosa 🌼',
              'Te Amo ☀️',
              'Mi girasol 🌻',
              'Mi alegría 💛',
              'Luz de mi vida ✨',
              'Mi destino 💛',
              'Amor lindo 🌻',
              'Para siempre ✨',
              'Amor de mi vida 💛'
            ];

      const phraseEmojis = [];

      const decoratedPhrases =
        phrases.map(function(
          phrase,
          index
        ) {
          return (
            String(phrase).trim() +
            ' ' +
            (
              phraseEmojis[
                index %
                (
                  phraseEmojis.length ||
                  1
                )
              ] || ''
            )
          );
        });

      const isCompactDevice =
        window.innerWidth < 700;

      const arms = 5;
      const radius = 82;
      const maxH = 22;

      const imageProxy = function(url) {
        return url;
      };

      const ringImgs =
        Array.isArray(CFG.ringImages) &&
        CFG.ringImages.length
          ? CFG.ringImages.slice()
          : [];

      const photoOrbit =
        new THREE.Group();

      photoOrbit.renderOrder = 0;

      scene.add(photoOrbit);

      const textTextureCache =
        new Map();

      const imageTextureCache =
        new Map();

      const phraseColors = [
        '#ffcc00',
        '#ffa600',
        '#ffeb3b',
        '#ffb300',
        '#ffc107',
        '#ff9800',
        '#ffffff'
      ];

      const coreGeometry =
        new THREE.SphereGeometry(
          8,
          64,
          64
        );

      const coreMaterial =
        new THREE.MeshBasicMaterial({
          color: 0xffcc33
        });

      const core =
        new THREE.Mesh(
          coreGeometry,
          coreMaterial
        );

      galaxy.add(core);

      let titleMesh = null;

      const textGroup =
        new THREE.Group();

      galaxy.add(textGroup);

      const textLoader =
        new THREE.FontLoader(
          loadingManager
        );

      textLoader.load(
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/fonts/optimer_regular.typeface.json',
        function(font) {
          const titleGeometry =
            new THREE.TextGeometry(
              CFG.title3d ||
                'Te amo',
              {
                font: font,
                size: isCompactDevice
                  ? 5.2
                  : 6.2,
                height: 1.35,
                curveSegments: 16,
                bevelEnabled: true,
                bevelThickness: 0.28,
                bevelSize: 0.14,
                bevelOffset: 0,
                bevelSegments: 6
              }
            );

          titleGeometry.computeBoundingBox();

          const bounds =
            titleGeometry.boundingBox;

          titleGeometry.translate(
            -(
              bounds.max.x -
              bounds.min.x
            ) / 2 -
              bounds.min.x,
            -(
              bounds.max.y -
              bounds.min.y
            ) / 2 -
              bounds.min.y,
            -(
              bounds.max.z -
              bounds.min.z
            ) / 2 -
              bounds.min.z
          );

          const titleFrontMaterial =
            new THREE.MeshPhongMaterial({
              color: 0xffe680,
              emissive: 0x8a6600,
              shininess: 150,
              specular: 0xffffff
            });

          const titleSideMaterial =
            new THREE.MeshPhongMaterial({
              color: 0xcc9900,
              emissive: 0x332200,
              shininess: 95,
              specular: 0xffcc00
            });

          titleMesh =
            new THREE.Mesh(
              titleGeometry,
              [
                titleFrontMaterial,
                titleSideMaterial
              ]
            );

          titleMesh.position.set(
            0,
            isCompactDevice
              ? 24
              : 22,
            2
          );

          titleMesh.rotation.x =
            -0.1;

          titleMesh.renderOrder = 2;

          textGroup.add(titleMesh);

          const titleLight =
            new THREE.PointLight(
              0xffd700,
              1.1,
              75
            );

          titleLight.position.set(
            0,
            isCompactDevice
              ? 24
              : 22,
            20
          );

          scene.add(titleLight);
        }
      );

      let saturnWrap = null;

      const loader =
        new THREE.TextureLoader(
          loadingManager
        );

      loader.load(
        'flower.jpg',
        function(tex) {
          const sourceImage =
            tex.image;

          const maskCanvas =
            document.createElement(
              'canvas'
            );

          maskCanvas.width =
            sourceImage.width;

          maskCanvas.height =
            sourceImage.height;

          const maskContext =
            maskCanvas.getContext(
              '2d'
            );

          maskContext.drawImage(
            sourceImage,
            0,
            0
          );

          const imageData =
            maskContext.getImageData(
              0,
              0,
              maskCanvas.width,
              maskCanvas.height
            );

          const pixels =
            imageData.data;

          for (
            let i = 0;
            i < pixels.length;
            i += 4
          ) {
            const red = pixels[i];
            const green = pixels[i + 1];
            const blue = pixels[i + 2];

            if (
              red > 242 &&
              green > 235 &&
              blue > 232
            ) {
              pixels[i + 3] = 0;
            }
          }

          maskContext.putImageData(
            imageData,
            0,
            0
          );

          const maskedTexture =
            new THREE.CanvasTexture(
              maskCanvas
            );

          if (
            typeof THREE.sRGBEncoding !==
            'undefined'
          ) {
            maskedTexture.encoding =
              THREE.sRGBEncoding;
          }

          maskedTexture.needsUpdate =
            true;

          core.material =
            new THREE.MeshBasicMaterial({
              map: maskedTexture,
              transparent: true,
              alphaTest: 0.02,
              side: THREE.DoubleSide
            });

          core.material.needsUpdate =
            true;

          if (saturnWrap) {
            saturnWrap.visible =
              false;
          }
        }
      );

      function animate() {
        requestAnimationFrame(
          animate
        );

        if (!backgroundReady) {
          return;
        }

        const t =
          performance.now() *
          0.001;

        if (cinematicState !== null) {
          if (
            cinematicStart === null
          ) {
            cinematicStart = t;
          }

          const elapsed =
            t - cinematicStart;

          if (
            elapsed <
            cinematicDuration1
          ) {
            const prog =
              elapsed /
              cinematicDuration1;

            camera.position.lerpVectors(
              new THREE.Vector3(
                0,
                0,
                220
              ),
              new THREE.Vector3(
                0,
                18,
                38
              ),
              prog
            );

            camera.lookAt(
              0,
              0,
              0
            );

            controls.enabled =
              false;
          } else if (
            elapsed <
            cinematicDuration1 +
              cinematicDuration2
          ) {
            const prog =
              (
                elapsed -
                cinematicDuration1
              ) /
              cinematicDuration2;

            const angle =
              Math.PI / 2 +
              prog *
                Math.PI *
                2 *
                0.20;

            const cameraRadius =
              38;

            const y = 18;

            camera.position.x =
              Math.cos(angle) *
              cameraRadius;

            camera.position.y =
              y;

            camera.position.z =
              Math.sin(angle) *
              cameraRadius;

            camera.lookAt(
              0,
              0,
              0
            );

            controls.enabled =
              false;
          } else if (
            elapsed <
            cinematicTotal
          ) {
            const prog =
              (
                elapsed -
                cinematicDuration1 -
                cinematicDuration2
              ) /
              cinematicDuration3;

            const startAngle =
              Math.PI / 2 +
              Math.PI *
                2 *
                0.85;

            const startRadius =
              38;

            const endRadius =
              120;

            const startY =
              18;

            const endY =
              50;

            const currentRadius =
              startRadius +
              (
                endRadius -
                startRadius
              ) *
                prog;

            camera.position.x =
              Math.cos(startAngle) *
              currentRadius;

            camera.position.y =
              startY +
              (
                endY -
                startY
              ) *
                prog;

            camera.position.z =
              Math.sin(startAngle) *
              currentRadius;

            camera.lookAt(
              0,
              0,
              0
            );

            controls.enabled =
              false;
          } else {
            controls.enabled =
              true;

            cinematicState =
              null;
          }
        }

        galaxy.rotation.y =
          t * 0.05;

        core.rotation.y =
          t * 0.12;

        photoOrbit.rotation.y =
          t * 0.05;

        if (titleMesh) {
          titleMesh.lookAt(
            camera.position
          );

          titleMesh.rotateY(
            Math.sin(t * 0.65) *
              0.08
          );
        }

        if (
          saturnWrap &&
          saturnWrap.visible
        ) {
          saturnWrap.rotation.y =
            t * 0.12;
        }

        for (
          let i =
            explosions.length - 1;
          i >= 0;
          i--
        ) {
          const e =
            explosions[i];

          e.material.opacity *=
            0.94;

          e.userData.life -=
            0.018;

          if (
            e.userData.life <=
            0.05
          ) {
            scene.remove(e);

            e.geometry.dispose();

            if (
              e.material.map
            ) {
              e.material.map.dispose();
            }

            e.material.dispose();

            explosions.splice(
              i,
              1
            );
          }
        }

        controls.update();

        renderer.render(
          scene,
          camera
        );
      }

      animate();

      const fx =
        document.getElementById(
          'fx'
        );

      if (!fx) {
        throw new Error(
          'No se encontró el canvas fx'
        );
      }

      const ctx2 =
        fx.getContext('2d');

      function resizeFx() {
        const dpr =
          Math.min(
            2,
            window.devicePixelRatio ||
              1
          );

        fx.width =
          Math.floor(
            window.innerWidth *
              dpr
          );

        fx.height =
          Math.floor(
            window.innerHeight *
              dpr
          );

        fx.style.width =
          window.innerWidth +
          'px';

        fx.style.height =
          window.innerHeight +
          'px';
      }

      window.addEventListener(
        'resize',
        resizeFx
      );

      resizeFx();

      const DPR =
        Math.min(
          2,
          window.devicePixelRatio ||
            1
        );

      const hearts = [];
      const loveRings = [];

      const effectColors = [
        '#ffcc00',
        '#ffa600',
        '#ffeb3b',
        '#ffb300',
        '#ffc107',
        '#ff9800',
        '#ffffff'
      ];

      function spawnHearts(
        x,
        y,
        n = 34
      ) {
        x *= DPR;
        y *= DPR;

        loveRings.push({
          x: x,
          y: y,
          radius: 8 * DPR,
          life: 1,
          color:
            effectColors[
              Math.floor(
                Math.random() *
                  effectColors.length
              )
            ]
        });

        for (
          let i = 0;
          i < n;
          i++
        ) {
          const a =
            (i / n) *
              Math.PI *
              2 +
            (
              Math.random() -
              0.5
            ) *
              0.3;

          const speed =
            (
              1.4 +
              Math.random() *
                3
            ) *
            DPR;

          const type =
            i % 5 === 0
              ? 'star'
              : i % 3 === 0
                ? 'spark'
                : 'heart';

          hearts.push({
            x: x,
            y: y,
            vx:
              Math.cos(a) *
              speed,
            vy:
              Math.sin(a) *
                speed -
              1.1 *
                DPR,
            life: 1,
            decay:
              0.012 +
              Math.random() *
                0.008,
            size:
              (
                7 +
                Math.random() *
                  13
              ) *
              DPR,
            color:
              effectColors[
                i %
                  effectColors.length
              ],
            type: type,
            rotation:
              Math.random() *
              Math.PI,
            spin:
              (
                Math.random() -
                0.5
              ) *
              0.12
          });
        }
      }

      function drawHeart(
        x,
        y,
        size,
        color,
        rotation
      ) {
        const s = size;

        ctx2.save();

        ctx2.translate(
          x,
          y
        );

        ctx2.rotate(
          rotation
        );

        ctx2.beginPath();

        ctx2.moveTo(
          0,
          -0.25 * s
        );

        ctx2.bezierCurveTo(
          0.5 * s,
          -0.9 * s,
          1.4 * s,
          -0.1 * s,
          0,
          0.9 * s
        );

        ctx2.bezierCurveTo(
          -1.4 * s,
          -0.1 * s,
          -0.5 * s,
          -0.9 * s,
          0,
          -0.25 * s
        );

        ctx2.shadowColor =
          color;

        ctx2.shadowBlur =
          15 * DPR;

        ctx2.fillStyle =
          color;

        ctx2.fill();

        ctx2.restore();
      }

      function drawStar(
        x,
        y,
        size,
        color,
        rotation,
        points = 5
      ) {
        ctx2.save();

        ctx2.translate(
          x,
          y
        );

        ctx2.rotate(
          rotation
        );

        ctx2.beginPath();

        for (
          let i = 0;
          i < points * 2;
          i++
        ) {
          const pointRadius =
            i % 2 === 0
              ? size
              : size * 0.38;

          const angle =
            -Math.PI / 2 +
            i *
              Math.PI /
              points;

          const px =
            Math.cos(angle) *
            pointRadius;

          const py =
            Math.sin(angle) *
            pointRadius;

          if (i === 0) {
            ctx2.moveTo(
              px,
              py
            );
          } else {
            ctx2.lineTo(
              px,
              py
            );
          }
        }

        ctx2.closePath();

        ctx2.shadowColor =
          color;

        ctx2.shadowBlur =
          18 * DPR;

        ctx2.fillStyle =
          color;

        ctx2.fill();

        ctx2.restore();
      }

      function drawSpark(
        x,
        y,
        size,
        color,
        rotation
      ) {
        drawStar(
          x,
          y,
          size,
          color,
          rotation,
          4
        );
      }

      let lastTap = {
        time: 0,
        x: 0,
        y: 0
      };

      window.addEventListener(
        'pointerup',
        function(e) {
          const now =
            performance.now();

          const distance =
            Math.hypot(
              e.clientX -
                lastTap.x,
              e.clientY -
                lastTap.y
            );

          if (
            now -
              lastTap.time <
              360 &&
            distance <
              55
          ) {
            spawnHearts(
              e.clientX,
              e.clientY
            );

            lastTap.time =
              0;
          } else {
            lastTap = {
              time: now,
              x: e.clientX,
              y: e.clientY
            };
          }
        },
        {
          passive: true
        }
      );

      function loopFx() {
        ctx2.clearRect(
          0,
          0,
          fx.width,
          fx.height
        );

        for (
          let i =
            loveRings.length - 1;
          i >= 0;
          i--
        ) {
          const ring =
            loveRings[i];

          ring.radius +=
            5 * DPR;

          ring.life -=
            0.035;

          ctx2.globalAlpha =
            Math.max(
              0,
              ring.life
            );

          ctx2.beginPath();

          ctx2.arc(
            ring.x,
            ring.y,
            ring.radius,
            0,
            Math.PI * 2
          );

          ctx2.strokeStyle =
            ring.color;

          ctx2.lineWidth =
            3 *
            DPR *
            ring.life;

          ctx2.shadowColor =
            ring.color;

          ctx2.shadowBlur =
            18 * DPR;

          ctx2.stroke();

          ctx2.shadowBlur =
            0;

          ctx2.globalAlpha =
            1;

          if (
            ring.life <=
            0
          ) {
            loveRings.splice(
              i,
              1
            );
          }
        }

        for (
          let i =
            hearts.length - 1;
          i >= 0;
          i--
        ) {
          const h =
            hearts[i];

          h.x += h.vx;
          h.y += h.vy;

          h.vx *= 0.985;

          h.vy =
            h.vy *
              0.985 +
            0.025 *
              DPR;

          h.rotation +=
            h.spin;

          h.life -=
            h.decay;

          const drawSize =
            h.size *
            (
              0.65 +
              h.life *
                0.45
            );

          ctx2.globalAlpha =
            Math.max(
              0,
              h.life
            );

          if (
            h.type ===
            'star'
          ) {
            drawStar(
              h.x,
              h.y,
              drawSize,
              h.color,
              h.rotation
            );
          } else if (
            h.type ===
            'spark'
          ) {
            drawSpark(
              h.x,
              h.y,
              drawSize,
              h.color,
              h.rotation
            );
          } else {
            drawHeart(
              h.x,
              h.y,
              drawSize,
              h.color,
              h.rotation
            );
          }

          ctx2.globalAlpha =
            1;

          if (
            h.life <=
            0
          ) {
            hearts.splice(
              i,
              1
            );
          }
        }

        requestAnimationFrame(
          loopFx
        );
      }

      loopFx();

    } catch (e) {
      showError(
        'Error cargando la galaxia: ' +
          e.message
      );

      console.error(e);

      deliverReady({
        startCinematic: function() {}
      });
    }
  }
});

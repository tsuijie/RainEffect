import 'core-js';
import RainRenderer from "./rain-renderer";
import Raindrops from "./raindrops";
import {createCanvas, times, random, chance} from "./helpers";
import { TweenLite, Quint } from 'gsap';
import getImage from "./image-loader";

let textureRainFg, textureRainBg,
  textureStormLightningFg, textureStormLightningBg,
  textureFalloutFg, textureFalloutBg,
  textureSunFg, textureSunBg,
  textureDrizzleFg, textureDrizzleBg,
  dropColor, dropAlpha;

let textureFg, textureFgCtx, textureBg, textureBgCtx;

let textureBgSize = {
  width: 384,
  height: 256
};
let textureFgSize = {
  width: 96,
  height: 64
};

let raindrops, renderer, canvas;

let parallax = {x: 0, y: 0};

let weatherData = null;
let curWeatherData = null;
let blend = {v: 0};

export function init(ref) {
  canvas = ref;
  let dpi = window.devicePixelRatio;
  canvas.width = window.innerWidth * dpi;
  canvas.height = window.innerHeight * dpi;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  Promise.all([
    getImage(require('@/static/images/drop-alpha.png')),
    getImage(require('@/static/images/drop-color.png')),
    getImage(require('@/static/images/texture-rain-fg.png')),
    getImage(require('@/static/images/texture-rain-bg.png')),
  ]).then(arr => {
    dropAlpha = arr[0];
    dropColor = arr[1];
    textureRainFg = arr[2];
    textureRainBg = arr[3];
    raindrops = new Raindrops(
      canvas.width,
      canvas.height,
      dpi,
      dropAlpha,
      dropColor, {
        trailRate: 1,
        trailScaleRange: [0.2, 0.45],
        collisionRadius: 0.45,
        dropletsCleaningRadiusMultiplier: 0.28,
      }
    );
    textureFg = createCanvas(textureFgSize.width, textureFgSize.height);
    textureFgCtx = textureFg.getContext('2d');
    textureBg = createCanvas(textureBgSize.width, textureBgSize.height);
    textureBgCtx = textureBg.getContext('2d');

    generateTextures(textureRainFg, textureRainBg);

    renderer = new RainRenderer(canvas, raindrops.canvas, textureFg, textureBg, null, {
      brightness: 1.04,
      alphaMultiply: 6,
      alphaSubtract: 3,
    });
    setupParallax();
  });
}

// mouse parallax effect
export function setupParallax() {
  document.addEventListener('mousemove', (event) => {
    let x = event.pageX;
    let y = event.pageY;

    TweenLite.to(parallax, 1, {
      x: ((x / canvas.width) * 2) - 1,
      y: ((y / canvas.height) * 2) - 1,
      ease: Quint.easeOut,
      onUpdate: () => {
        renderer.parallaxX = parallax.x;
        renderer.parallaxY = parallax.y;
      }
    })
  });
}

export function setupFlash() {
  setInterval(() => {
    if (chance(curWeatherData.flashChance)) {
      flash(curWeatherData.bg, curWeatherData.fg, curWeatherData.flashBg, curWeatherData.flashFg);
    }
  }, 500)
}

export function setupWeather() {
  setupWeatherData();
  window.addEventListener("hashchange", (event) => {
    updateWeather();
  });
  updateWeather();
}

export function setupWeatherData() {
  let defaultWeather = {
    raining: true,
    minR: 20,
    maxR: 50,
    rainChance: 0.35,
    rainLimit: 6,
    dropletsRate: 50,
    dropletsSize: [3, 5.5],
    trailRate: 1,
    trailScaleRange: [0.25, 0.35],
    fg: textureRainFg,
    bg: textureRainBg,
    flashFg: null,
    flashBg: null,
    flashChance: 0,
    collisionRadiusIncrease: 0.0002
  };

  function weather(data) {
    return Object.assign({}, defaultWeather, data);
  }

  weatherData = {
    rain: weather({
      rainChance: 0.35,
      dropletsRate: 50,
      raining: true,
      // trailRate:2.5,
      fg: textureRainFg,
      bg: textureRainBg
    }),
    storm: weather({
      maxR: 55,
      rainChance: 0.4,
      dropletsRate: 80,
      dropletsSize: [3, 5.5],
      trailRate: 2.5,
      trailScaleRange: [0.25, 0.4],
      fg: textureRainFg,
      bg: textureRainBg,
      flashFg: textureStormLightningFg,
      flashBg: textureStormLightningBg,
      flashChance: 0.1
    }),
    fallout: weather({
      minR: 30,
      maxR: 60,
      rainChance: 0.35,
      dropletsRate: 20,
      trailRate: 4,
      fg: textureFalloutFg,
      bg: textureFalloutBg,
      collisionRadiusIncrease: 0
    }),
    drizzle: weather({
      minR: 10,
      maxR: 40,
      rainChance: 0.15,
      rainLimit: 2,
      dropletsRate: 10,
      dropletsSize: [3.5, 6],
      fg: textureDrizzleFg,
      bg: textureDrizzleBg
    }),
    sunny: weather({
      rainChance: 0,
      rainLimit: 0,
      droplets: 0,
      raining: false,
      fg: textureSunFg,
      bg: textureSunBg
    }),
  };
}

export function updateWeather() {
  let hash = window.location.hash;
  let currentSlide = null;
  let currentNav = null;
  if (hash !== "") {
    currentSlide = document.querySelector(hash);
  }
  if (currentSlide == null) {
    currentSlide = document.querySelector(".slide");
    hash = "#" + currentSlide.getAttribute("id");
  }
  currentNav = document.querySelector("[href='" + hash + "']");
  let data = weatherData[currentSlide.getAttribute('data-weather')];
  curWeatherData = data;

  raindrops.options = Object.assign(raindrops.options, data);

  raindrops.clearDrops();

  TweenLite.fromTo(blend, 1, {v: 0}, {
    v: 1,
    onUpdate: () => {
      generateTextures(data.fg, data.bg, blend.v);
      renderer.updateTextures();
    }
  });

  let lastSlide = document.querySelector(".slide--current");
  if (lastSlide != null) lastSlide.classList.remove("slide--current");

  let lastNav = document.querySelector(".nav-item--current");
  if (lastNav != null) lastNav.classList.remove("nav-item--current");

  currentSlide.classList.add("slide--current");
  currentNav.classList.add("nav-item--current");
}

// create thunderstorm flash animation
function flash(baseBg, baseFg, flashBg, flashFg) {
  let flashValue = {v: 0};

  function transitionFlash(to, t = 0.025) {
    return new Promise((resolve, reject) => {
      TweenLite.to(flashValue, t, {
        v: to,
        ease: Quint.easeOut,
        onUpdate: () => {
          generateTextures(baseFg, baseBg);
          generateTextures(flashFg, flashBg, flashValue.v);
          renderer.updateTextures();
        },
        onComplete: () => {
          resolve();
        }
      });
    });
  }

  let lastFlash = transitionFlash(1);
  times(random(2, 7), (i) => {
    lastFlash = lastFlash.then(() => {
      return transitionFlash(random(0.1, 1))
    })
  });
  lastFlash = lastFlash.then(() => {
    return transitionFlash(1, 0.1);
  }).then(() => {
    transitionFlash(0, 0.25);
  });
}

// generate background textures
export function generateTextures(fg, bg, alpha = 1) {
  textureFgCtx.globalAlpha = alpha;
  textureFgCtx.drawImage(fg, 0, 0, textureFgSize.width, textureFgSize.height);

  textureBgCtx.globalAlpha = alpha;
  textureBgCtx.drawImage(bg, 0, 0, textureBgSize.width, textureBgSize.height);
}

export default init;
// run func for n times
export function times(n, func) {
  for (let i = 0; i < n; i++) {
    func.call(this, i);
  }
}

export function random(from = null, to = null, interpolation = null) {
  if (from == null) {
    from = 0;
    to = 1;
  } else if (to === null) {
    to = from;
    from = 0;
  }
  const delta = to - from;

  if (interpolation == null) {
    interpolation = (n) => {
      return n;
    }
  }
  return from + (interpolation(Math.random()) * delta);
}

export function chance(c) {
  return random() <= c;
}

export async function loadImage(src) {

}

// create canvas element with with and height
export function createCanvas(width, height) {
  let canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// WebGL related functions
// progressively test if browser support webgl or experimental-webgl
export function getContext(canvas, options={}) {
  let context = null;
  ["webgl", "experimental-webgl"].some(name => {
    try {
      context = canvas.getContext(name, options);
    } catch (e) {}
    return context != null;
  });
  // if (context == null) document.body.classList.add("no-webgl");
  return context;
}

// create webgl program
export function createProgram(gl, vertexScript, fragScript) {
  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl, vertexScript, gl.VERTEX_SHADER));
  gl.attachShader(program, createShader(gl, fragScript, gl.FRAGMENT_SHADER));
  gl.linkProgram(program);
  let linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    console.error("Error in program linking: " + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0,
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  // Create a buffer for the position of the rectangle corners.
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  return program;
}

export function createShader(gl, script, type) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, script);
  gl.compileShader(shader);

  let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (!compiled) {
    console.log("Error compiling shader '" + shader + "':" + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createUniform(gl, program, type, name, ...args) {
  let location = gl.getUniformLocation(program, "u_" + name);
  gl["uniform" + type](location, ...args);
}

export function createTexture(gl, source, i) {
  const texture = gl.createTexture();
  activeTexture(gl, i);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  if (source == null) {
    return texture;
  } else {
    updateTexture(gl, source);
  }

  return texture;
}

export function activeTexture(gl, i) {
  gl.activeTexture(gl["TEXTURE" + i]);
}

export function updateTexture(gl, source) {
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}

export function setRectangle(gl, x, y, width, height) {
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2,
  ]), gl.STATIC_DRAW);
}

export function GL(canvas, options, vert, frag) {
  this.init(canvas, options, vert, frag);
}

GL.prototype = {
  canvas: null,
  gl: null,
  program: null,
  width: 0,
  height: 0,
  init(canvas, options, vert, frag) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.gl = getContext(canvas, options);
    this.program = this.createProgram(vert, frag);
    this.useProgram(this.program);
  },
  createProgram(vert, frag) {
    return createProgram(this.gl, vert, frag);
  },
  useProgram(program) {
    this.program = program;
    this.gl.useProgram(program);
  },
  createTexture(source, i) {
    return createTexture(this.gl, source, i);
  },
  createUniform(type, name, ...v) {
    createUniform(this.gl, this.program, type, name, ...v);
  },
  activeTexture(i) {
    activeTexture(this.gl, i);
  },
  updateTexture(source) {
    updateTexture(this.gl, source);
  },
  draw() {
    setRectangle(this.gl, -1, -1, 2, 2);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
};

export default GL;
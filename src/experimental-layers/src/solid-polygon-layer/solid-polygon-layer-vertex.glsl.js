// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

export default `\
#define SHADER_NAME solid-polygon-layer-vertex-shader

attribute vec2 vertexPositions;
attribute vec3 positions;
attribute vec2 positions64xyLow;
attribute vec3 nextPositions;
attribute vec2 nextPositions64xyLow;
attribute float elevations;
attribute vec4 colors;
attribute vec3 pickingColors;

uniform float isSideVertex;
uniform float extruded;
uniform float elevationScale;
uniform float opacity;

varying vec4 vColor;

void main(void) {

  vec3 pos;
  vec2 pos64xyLow;
  vec3 normal;

  if (isSideVertex > 0.5) {
    pos = mix(positions, nextPositions, vertexPositions.x);
    pos64xyLow = mix(positions64xyLow, nextPositions64xyLow, vertexPositions.x);
  } else {
    pos = positions;
    pos64xyLow = positions64xyLow;
  }
  if (extruded > 0.5) {
    pos.z += elevations * vertexPositions.y;
  }
  pos.z *= elevationScale;

  vec4 position_worldspace;
  gl_Position = project_position_to_clipspace(pos, pos64xyLow, vec3(0.), position_worldspace);

  float lightWeight = 1.0;
  
  if (extruded > 0.5) {
    if (isSideVertex > 0.5) {
      normal = vec3(positions.y - nextPositions.y, nextPositions.x - positions.x, 0.0);
      normal = project_normal(normal);
    } else {
      normal = vec3(0.0, 0.0, 1.0);
    }

    // Here, the input parameters should be
    // position_worldspace.xyz / position_worldspace.w.
    // However, this calculation generates all zeros on
    // MacBook Pro with Intel Iris Pro GPUs for unclear reasons.
    // (see https://github.com/uber/deck.gl/issues/559)
    // Since the w component is always 1.0 in our shaders,
    // we decided to just provide xyz component of position_worldspace
    // to the getLightWeight() function
    lightWeight = getLightWeight(position_worldspace.xyz, normal);
  }

  vec3 lightWeightedColor = lightWeight * colors.rgb;
  vColor = vec4(lightWeightedColor, colors.a * opacity) / 255.0;

  // Set color to be rendered to picking fbo (also used to check for selection highlight).
  picking_setPickingColor(pickingColors);
}
`;

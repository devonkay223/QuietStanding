(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.genish = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
  'use strict';
  
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'abs',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add(_defineProperty({}, this.name, isWorklet ? 'Math.abs' : Math.abs));
  
        out = ref + 'abs( ' + inputs[0] + ' )';
      } else {
        out = Math.abs(parseFloat(inputs[0]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var abs = Object.create(proto);
  
    abs.inputs = [x];
  
    return abs;
  };
  
  },{"./gen.js":32}],2:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'accum',
  
    gen: function gen() {
      var code = void 0,
          inputs = _gen.getInputs(this),
          genName = 'gen.' + this.name,
          functionBody = void 0;
  
      _gen.requestMemory(this.memory);
  
      _gen.memory.heap[this.memory.value.idx] = this.initialValue;
  
      functionBody = this.callback(genName, inputs[0], inputs[1], 'memory[' + this.memory.value.idx + ']');
  
      //gen.closures.add({ [ this.name ]: this }) 
  
      _gen.memo[this.name] = this.name + '_value';
  
      return [this.name + '_value', functionBody];
    },
    callback: function callback(_name, _incr, _reset, valueRef) {
      var diff = this.max - this.min,
          out = '',
          wrap = '';
  
      /* three different methods of wrapping, third is most expensive:
       *
       * 1: range {0,1}: y = x - (x | 0)
       * 2: log2(this.max) == integer: y = x & (this.max - 1)
       * 3: all others: if( x >= this.max ) y = this.max -x
       *
       */
  
      // must check for reset before storing value for output
      if (!(typeof this.inputs[1] === 'number' && this.inputs[1] < 1)) {
        if (this.resetValue !== this.min) {
  
          out += '  if( ' + _reset + ' >=1 ) ' + valueRef + ' = ' + this.resetValue + '\n\n';
          //out += `  if( ${_reset} >=1 ) ${valueRef} = ${this.min}\n\n`
        } else {
          out += '  if( ' + _reset + ' >=1 ) ' + valueRef + ' = ' + this.min + '\n\n';
          //out += `  if( ${_reset} >=1 ) ${valueRef} = ${this.initialValue}\n\n`
        }
      }
  
      out += '  var ' + this.name + '_value = ' + valueRef + '\n';
  
      if (this.shouldWrap === false && this.shouldClamp === true) {
        out += '  if( ' + valueRef + ' < ' + this.max + ' ) ' + valueRef + ' += ' + _incr + '\n';
      } else {
        out += '  ' + valueRef + ' += ' + _incr + '\n'; // store output value before accumulating  
      }
  
      if (this.max !== Infinity && this.shouldWrapMax) wrap += '  if( ' + valueRef + ' >= ' + this.max + ' ) ' + valueRef + ' -= ' + diff + '\n';
      if (this.min !== -Infinity && this.shouldWrapMin) wrap += '  if( ' + valueRef + ' < ' + this.min + ' ) ' + valueRef + ' += ' + diff + '\n';
  
      //if( this.min === 0 && this.max === 1 ) { 
      //  wrap =  `  ${valueRef} = ${valueRef} - (${valueRef} | 0)\n\n`
      //} else if( this.min === 0 && ( Math.log2( this.max ) | 0 ) === Math.log2( this.max ) ) {
      //  wrap =  `  ${valueRef} = ${valueRef} & (${this.max} - 1)\n\n`
      //} else if( this.max !== Infinity ){
      //  wrap = `  if( ${valueRef} >= ${this.max} ) ${valueRef} -= ${diff}\n\n`
      //}
  
      out = out + wrap + '\n';
  
      return out;
    },
  
  
    defaults: { min: 0, max: 1, resetValue: 0, initialValue: 0, shouldWrap: true, shouldWrapMax: true, shouldWrapMin: true, shouldClamp: false }
  };
  
  module.exports = function (incr) {
    var reset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var properties = arguments[2];
  
    var ugen = Object.create(proto);
  
    Object.assign(ugen, {
      uid: _gen.getUID(),
      inputs: [incr, reset],
      memory: {
        value: { length: 1, idx: null }
      }
    }, proto.defaults, properties);
  
    if (properties !== undefined && properties.shouldWrapMax === undefined && properties.shouldWrapMin === undefined) {
      if (properties.shouldWrap !== undefined) {
        ugen.shouldWrapMin = ugen.shouldWrapMax = properties.shouldWrap;
      }
    }
  
    if (properties !== undefined && properties.resetValue === undefined) {
      ugen.resetValue = ugen.min;
    }
  
    if (ugen.initialValue === undefined) ugen.initialValue = ugen.min;
  
    Object.defineProperty(ugen, 'value', {
      get: function get() {
        //console.log( 'gen:', gen, gen.memory )
        return _gen.memory.heap[this.memory.value.idx];
      },
      set: function set(v) {
        _gen.memory.heap[this.memory.value.idx] = v;
      }
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./gen.js":32}],3:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'acos',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add({ 'acos': isWorklet ? 'Math.acos' : Math.acos });
  
        out = ref + 'acos( ' + inputs[0] + ' )';
      } else {
        out = Math.acos(parseFloat(inputs[0]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var acos = Object.create(proto);
  
    acos.inputs = [x];
    acos.id = _gen.getUID();
    acos.name = acos.basename + '{acos.id}';
  
    return acos;
  };
  
  },{"./gen.js":32}],4:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      mul = require('./mul.js'),
      sub = require('./sub.js'),
      div = require('./div.js'),
      data = require('./data.js'),
      peek = require('./peek.js'),
      accum = require('./accum.js'),
      ifelse = require('./ifelseif.js'),
      lt = require('./lt.js'),
      bang = require('./bang.js'),
      env = require('./env.js'),
      add = require('./add.js'),
      poke = require('./poke.js'),
      neq = require('./neq.js'),
      and = require('./and.js'),
      gte = require('./gte.js'),
      memo = require('./memo.js'),
      utilities = require('./utilities.js');
  
  module.exports = function () {
    var attackTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 44100;
    var decayTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 44100;
    var _props = arguments[2];
  
    var props = Object.assign({}, { shape: 'exponential', alpha: 5, trigger: null }, _props);
    var _bang = props.trigger !== null ? props.trigger : bang(),
        phase = accum(1, _bang, { min: 0, max: Infinity, initialValue: -Infinity, shouldWrap: false });
  
    var bufferData = void 0,
        bufferDataReverse = void 0,
        decayData = void 0,
        out = void 0,
        buffer = void 0;
  
    //console.log( 'shape:', props.shape, 'attack time:', attackTime, 'decay time:', decayTime )
    var completeFlag = data([0]);
  
    // slightly more efficient to use existing phase accumulator for linear envelopes
    if (props.shape === 'linear') {
      out = ifelse(and(gte(phase, 0), lt(phase, attackTime)), div(phase, attackTime), and(gte(phase, 0), lt(phase, add(attackTime, decayTime))), sub(1, div(sub(phase, attackTime), decayTime)), neq(phase, -Infinity), poke(completeFlag, 1, 0, { inline: 0 }), 0);
    } else {
      bufferData = env({ length: 1024, type: props.shape, alpha: props.alpha });
      bufferDataReverse = env({ length: 1024, type: props.shape, alpha: props.alpha, reverse: true });
  
      out = ifelse(and(gte(phase, 0), lt(phase, attackTime)), peek(bufferData, div(phase, attackTime), { boundmode: 'clamp' }), and(gte(phase, 0), lt(phase, add(attackTime, decayTime))), peek(bufferDataReverse, div(sub(phase, attackTime), decayTime), { boundmode: 'clamp' }), neq(phase, -Infinity), poke(completeFlag, 1, 0, { inline: 0 }), 0);
    }
  
    var usingWorklet = gen.mode === 'worklet';
    if (usingWorklet === true) {
      out.node = null;
      utilities.register(out);
    }
  
    // needed for gibberish... getting this to work right with worklets
    // via promises will probably be tricky
    out.isComplete = function () {
      if (usingWorklet === true && out.node !== null) {
        var p = new Promise(function (resolve) {
          out.node.getMemoryValue(completeFlag.memory.values.idx, resolve);
        });
  
        return p;
      } else {
        return gen.memory.heap[completeFlag.memory.values.idx];
      }
    };
  
    out.trigger = function () {
      if (usingWorklet === true && out.node !== null) {
        out.node.port.postMessage({ key: 'set', idx: completeFlag.memory.values.idx, value: 0 });
      } else {
        gen.memory.heap[completeFlag.memory.values.idx] = 0;
      }
      _bang.trigger();
    };
  
    return out;
  };
  
  },{"./accum.js":2,"./add.js":5,"./and.js":7,"./bang.js":11,"./data.js":18,"./div.js":23,"./env.js":24,"./gen.js":32,"./gte.js":34,"./ifelseif.js":37,"./lt.js":40,"./memo.js":44,"./mul.js":50,"./neq.js":51,"./peek.js":56,"./poke.js":58,"./sub.js":69,"./utilities.js":75}],5:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'add',
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          out = '',
          sum = 0,
          numCount = 0,
          adderAtEnd = false,
          alreadyFullSummed = true;
  
      if (inputs.length === 0) return 0;
  
      out = '  var ' + this.name + ' = ';
  
      inputs.forEach(function (v, i) {
        if (isNaN(v)) {
          out += v;
          if (i < inputs.length - 1) {
            adderAtEnd = true;
            out += ' + ';
          }
          alreadyFullSummed = false;
        } else {
          sum += parseFloat(v);
          numCount++;
        }
      });
  
      if (numCount > 0) {
        out += adderAtEnd || alreadyFullSummed ? sum : ' + ' + sum;
      }
  
      out += '\n';
  
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
    }
  };
  
  module.exports = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
  
    var add = Object.create(proto);
    add.id = _gen.getUID();
    add.name = add.basename + add.id;
    add.inputs = args;
  
    return add;
  };
  
  },{"./gen.js":32}],6:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      mul = require('./mul.js'),
      sub = require('./sub.js'),
      div = require('./div.js'),
      data = require('./data.js'),
      peek = require('./peek.js'),
      accum = require('./accum.js'),
      ifelse = require('./ifelseif.js'),
      lt = require('./lt.js'),
      bang = require('./bang.js'),
      env = require('./env.js'),
      param = require('./param.js'),
      add = require('./add.js'),
      gtp = require('./gtp.js'),
      not = require('./not.js'),
      and = require('./and.js'),
      neq = require('./neq.js'),
      poke = require('./poke.js');
  
  module.exports = function () {
    var attackTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 44;
    var decayTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 22050;
    var sustainTime = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 44100;
    var sustainLevel = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : .6;
    var releaseTime = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 44100;
    var _props = arguments[5];
  
    var envTrigger = bang(),
        phase = accum(1, envTrigger, { max: Infinity, shouldWrap: false, initialValue: Infinity }),
        shouldSustain = param(1),
        defaults = {
      shape: 'exponential',
      alpha: 5,
      triggerRelease: false
    },
        props = Object.assign({}, defaults, _props),
        bufferData = void 0,
        decayData = void 0,
        out = void 0,
        buffer = void 0,
        sustainCondition = void 0,
        releaseAccum = void 0,
        releaseCondition = void 0;
  
    var completeFlag = data([0]);
  
    bufferData = env({ length: 1024, alpha: props.alpha, shift: 0, type: props.shape });
  
    sustainCondition = props.triggerRelease ? shouldSustain : lt(phase, add(attackTime, decayTime, sustainTime));
  
    releaseAccum = props.triggerRelease ? gtp(sub(sustainLevel, accum(div(sustainLevel, releaseTime), 0, { shouldWrap: false })), 0) : sub(sustainLevel, mul(div(sub(phase, add(attackTime, decayTime, sustainTime)), releaseTime), sustainLevel)), releaseCondition = props.triggerRelease ? not(shouldSustain) : lt(phase, add(attackTime, decayTime, sustainTime, releaseTime));
  
    out = ifelse(
    // attack 
    lt(phase, attackTime), peek(bufferData, div(phase, attackTime), { boundmode: 'clamp' }),
  
    // decay
    lt(phase, add(attackTime, decayTime)), peek(bufferData, sub(1, mul(div(sub(phase, attackTime), decayTime), sub(1, sustainLevel))), { boundmode: 'clamp' }),
  
    // sustain
    and(sustainCondition, neq(phase, Infinity)), peek(bufferData, sustainLevel),
  
    // release
    releaseCondition, //lt( phase,  attackTime +  decayTime +  sustainTime +  releaseTime ),
    peek(bufferData, releaseAccum,
    //sub(  sustainLevel, mul( div( sub( phase,  attackTime +  decayTime +  sustainTime),  releaseTime ),  sustainLevel ) ), 
    { boundmode: 'clamp' }), neq(phase, Infinity), poke(completeFlag, 1, 0, { inline: 0 }), 0);
  
    var usingWorklet = gen.mode === 'worklet';
    if (usingWorklet === true) {
      out.node = null;
      utilities.register(out);
    }
  
    out.trigger = function () {
      shouldSustain.value = 1;
      envTrigger.trigger();
    };
  
    // needed for gibberish... getting this to work right with worklets
    // via promises will probably be tricky
    out.isComplete = function () {
      if (usingWorklet === true && out.node !== null) {
        var p = new Promise(function (resolve) {
          out.node.getMemoryValue(completeFlag.memory.values.idx, resolve);
        });
  
        return p;
      } else {
        return gen.memory.heap[completeFlag.memory.values.idx];
      }
    };
  
    out.release = function () {
      shouldSustain.value = 0;
      // XXX pretty nasty... grabs accum inside of gtp and resets value manually
      // unfortunately envTrigger won't work as it's back to 0 by the time the release block is triggered...
      if (usingWorklet && out.node !== null) {
        out.node.port.postMessage({ key: 'set', idx: releaseAccum.inputs[0].inputs[1].memory.value.idx, value: 0 });
      } else {
        gen.memory.heap[releaseAccum.inputs[0].inputs[1].memory.value.idx] = 0;
      }
    };
  
    return out;
  };
  
  },{"./accum.js":2,"./add.js":5,"./and.js":7,"./bang.js":11,"./data.js":18,"./div.js":23,"./env.js":24,"./gen.js":32,"./gtp.js":35,"./ifelseif.js":37,"./lt.js":40,"./mul.js":50,"./neq.js":51,"./not.js":53,"./param.js":55,"./peek.js":56,"./poke.js":58,"./sub.js":69}],7:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'and',
  
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          out = void 0;
  
      out = '  var ' + this.name + ' = (' + inputs[0] + ' !== 0 && ' + inputs[1] + ' !== 0) | 0\n\n';
  
      _gen.memo[this.name] = '' + this.name;
  
      return ['' + this.name, out];
    }
  };
  
  module.exports = function (in1, in2) {
    var ugen = Object.create(proto);
    Object.assign(ugen, {
      uid: _gen.getUID(),
      inputs: [in1, in2]
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./gen.js":32}],8:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'asin',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add({ 'asin': isWorklet ? 'Math.sin' : Math.asin });
  
        out = ref + 'asin( ' + inputs[0] + ' )';
      } else {
        out = Math.asin(parseFloat(inputs[0]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var asin = Object.create(proto);
  
    asin.inputs = [x];
    asin.id = _gen.getUID();
    asin.name = asin.basename + '{asin.id}';
  
    return asin;
  };
  
  },{"./gen.js":32}],9:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'atan',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add({ 'atan': isWorklet ? 'Math.atan' : Math.atan });
  
        out = ref + 'atan( ' + inputs[0] + ' )';
      } else {
        out = Math.atan(parseFloat(inputs[0]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var atan = Object.create(proto);
  
    atan.inputs = [x];
    atan.id = _gen.getUID();
    atan.name = atan.basename + '{atan.id}';
  
    return atan;
  };
  
  },{"./gen.js":32}],10:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      history = require('./history.js'),
      mul = require('./mul.js'),
      sub = require('./sub.js');
  
  module.exports = function () {
      var decayTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 44100;
  
      var ssd = history(1),
          t60 = Math.exp(-6.907755278921 / decayTime);
  
      ssd.in(mul(ssd.out, t60));
  
      ssd.out.trigger = function () {
          ssd.value = 1;
      };
  
      return sub(1, ssd.out);
  };
  
  },{"./gen.js":32,"./history.js":36,"./mul.js":50,"./sub.js":69}],11:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    gen: function gen() {
      _gen.requestMemory(this.memory);
  
      var out = '  var ' + this.name + ' = memory[' + this.memory.value.idx + ']\n  if( ' + this.name + ' === 1 ) memory[' + this.memory.value.idx + '] = 0      \n      \n';
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
    }
  };
  
  module.exports = function (_props) {
    var ugen = Object.create(proto),
        props = Object.assign({}, { min: 0, max: 1 }, _props);
  
    ugen.name = 'bang' + _gen.getUID();
  
    ugen.min = props.min;
    ugen.max = props.max;
  
    var usingWorklet = _gen.mode === 'worklet';
    if (usingWorklet === true) {
      ugen.node = null;
      utilities.register(ugen);
    }
  
    ugen.trigger = function () {
      if (usingWorklet === true && ugen.node !== null) {
        ugen.node.port.postMessage({ key: 'set', idx: ugen.memory.value.idx, value: ugen.max });
      } else {
        _gen.memory.heap[ugen.memory.value.idx] = ugen.max;
      }
    };
  
    ugen.memory = {
      value: { length: 1, idx: null }
    };
  
    return ugen;
  };
  
  },{"./gen.js":32}],12:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'bool',
  
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          out = void 0;
  
      out = inputs[0] + ' === 0 ? 0 : 1';
  
      //gen.memo[ this.name ] = `gen.data.${this.name}`
  
      //return [ `gen.data.${this.name}`, ' ' +out ]
      return out;
    }
  };
  
  module.exports = function (in1) {
    var ugen = Object.create(proto);
  
    Object.assign(ugen, {
      uid: _gen.getUID(),
      inputs: [in1]
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./gen.js":32}],13:[function(require,module,exports){
  'use strict';
  
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'ceil',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add(_defineProperty({}, this.name, isWorklet ? 'Math.ceil' : Math.ceil));
  
        out = ref + 'ceil( ' + inputs[0] + ' )';
      } else {
        out = Math.ceil(parseFloat(inputs[0]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var ceil = Object.create(proto);
  
    ceil.inputs = [x];
  
    return ceil;
  };
  
  },{"./gen.js":32}],14:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js'),
      floor = require('./floor.js'),
      sub = require('./sub.js'),
      memo = require('./memo.js');
  
  var proto = {
    basename: 'clip',
  
    gen: function gen() {
      var code = void 0,
          inputs = _gen.getInputs(this),
          out = void 0;
  
      out = ' var ' + this.name + ' = ' + inputs[0] + '\n  if( ' + this.name + ' > ' + inputs[2] + ' ) ' + this.name + ' = ' + inputs[2] + '\n  else if( ' + this.name + ' < ' + inputs[1] + ' ) ' + this.name + ' = ' + inputs[1] + '\n';
      out = ' ' + out;
  
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
    }
  };
  
  module.exports = function (in1) {
    var min = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
    var max = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  
    var ugen = Object.create(proto);
  
    Object.assign(ugen, {
      min: min,
      max: max,
      uid: _gen.getUID(),
      inputs: [in1, min, max]
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./floor.js":29,"./gen.js":32,"./memo.js":44,"./sub.js":69}],15:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'cos',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
  
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add({ 'cos': isWorklet ? 'Math.cos' : Math.cos });
  
        out = ref + 'cos( ' + inputs[0] + ' )';
      } else {
        out = Math.cos(parseFloat(inputs[0]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var cos = Object.create(proto);
  
    cos.inputs = [x];
    cos.id = _gen.getUID();
    cos.name = cos.basename + '{cos.id}';
  
    return cos;
  };
  
  },{"./gen.js":32}],16:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'counter',
  
    gen: function gen() {
      var code = void 0,
          inputs = _gen.getInputs(this),
          genName = 'gen.' + this.name,
          functionBody = void 0;
  
      if (this.memory.value.idx === null) _gen.requestMemory(this.memory);
      _gen.memory.heap[this.memory.value.idx] = this.initialValue;
  
      functionBody = this.callback(genName, inputs[0], inputs[1], inputs[2], inputs[3], inputs[4], 'memory[' + this.memory.value.idx + ']', 'memory[' + this.memory.wrap.idx + ']');
  
      _gen.memo[this.name] = this.name + '_value';
  
      if (_gen.memo[this.wrap.name] === undefined) this.wrap.gen();
  
      return [this.name + '_value', functionBody];
    },
    callback: function callback(_name, _incr, _min, _max, _reset, loops, valueRef, wrapRef) {
      var diff = this.max - this.min,
          out = '',
          wrap = '';
      // must check for reset before storing value for output
      if (!(typeof this.inputs[3] === 'number' && this.inputs[3] < 1)) {
        out += '  if( ' + _reset + ' >= 1 ) ' + valueRef + ' = ' + _min + '\n';
      }
  
      out += '  var ' + this.name + '_value = ' + valueRef + ';\n  ' + valueRef + ' += ' + _incr + '\n'; // store output value before accumulating  
  
      if (typeof this.max === 'number' && this.max !== Infinity && typeof this.min !== 'number') {
        wrap = '  if( ' + valueRef + ' >= ' + this.max + ' &&  ' + loops + ' > 0) {\n    ' + valueRef + ' -= ' + diff + '\n    ' + wrapRef + ' = 1\n  }else{\n    ' + wrapRef + ' = 0\n  }\n';
      } else if (this.max !== Infinity && this.min !== Infinity) {
        wrap = '  if( ' + valueRef + ' >= ' + _max + ' &&  ' + loops + ' > 0) {\n    ' + valueRef + ' -= ' + _max + ' - ' + _min + '\n    ' + wrapRef + ' = 1\n  }else if( ' + valueRef + ' < ' + _min + ' &&  ' + loops + ' > 0) {\n    ' + valueRef + ' += ' + _max + ' - ' + _min + '\n    ' + wrapRef + ' = 1\n  }else{\n    ' + wrapRef + ' = 0\n  }\n';
      } else {
        out += '\n';
      }
  
      out = out + wrap;
  
      return out;
    }
  };
  
  module.exports = function () {
    var incr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var min = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var max = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Infinity;
    var reset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var loops = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
    var properties = arguments[5];
  
    var ugen = Object.create(proto),
        defaults = Object.assign({ initialValue: 0, shouldWrap: true }, properties);
  
    Object.assign(ugen, {
      min: min,
      max: max,
      initialValue: defaults.initialValue,
      value: defaults.initialValue,
      uid: _gen.getUID(),
      inputs: [incr, min, max, reset, loops],
      memory: {
        value: { length: 1, idx: null },
        wrap: { length: 1, idx: null }
      },
      wrap: {
        gen: function gen() {
          if (ugen.memory.wrap.idx === null) {
            _gen.requestMemory(ugen.memory);
          }
          _gen.getInputs(this);
          _gen.memo[this.name] = 'memory[ ' + ugen.memory.wrap.idx + ' ]';
          return 'memory[ ' + ugen.memory.wrap.idx + ' ]';
        }
      }
    }, defaults);
  
    Object.defineProperty(ugen, 'value', {
      get: function get() {
        if (this.memory.value.idx !== null) {
          return _gen.memory.heap[this.memory.value.idx];
        }
      },
      set: function set(v) {
        if (this.memory.value.idx !== null) {
          _gen.memory.heap[this.memory.value.idx] = v;
        }
      }
    });
  
    ugen.wrap.inputs = [ugen];
    ugen.name = '' + ugen.basename + ugen.uid;
    ugen.wrap.name = ugen.name + '_wrap';
    return ugen;
  };
  
  },{"./gen.js":32}],17:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      accum = require('./phasor.js'),
      data = require('./data.js'),
      peek = require('./peek.js'),
      mul = require('./mul.js'),
      phasor = require('./phasor.js');
  
  var proto = {
    basename: 'cycle',
  
    initTable: function initTable() {
      var buffer = new Float32Array(1024);
  
      for (var i = 0, l = buffer.length; i < l; i++) {
        buffer[i] = Math.sin(i / l * (Math.PI * 2));
      }
  
      gen.globals.cycle = data(buffer, 1, { immutable: true });
    }
  };
  
  module.exports = function () {
    var frequency = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var reset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var _props = arguments[2];
  
    if (typeof gen.globals.cycle === 'undefined') proto.initTable();
    var props = Object.assign({}, { min: 0 }, _props);
  
    var ugen = peek(gen.globals.cycle, phasor(frequency, reset, props));
    ugen.name = 'cycle' + gen.getUID();
  
    return ugen;
  };
  
  },{"./data.js":18,"./gen.js":32,"./mul.js":50,"./peek.js":56,"./phasor.js":57}],18:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js'),
      utilities = require('./utilities.js'),
      peek = require('./peek.js'),
      poke = require('./poke.js');
  
  var proto = {
    basename: 'data',
    globals: {},
    memo: {},
  
    gen: function gen() {
      var idx = void 0;
      //console.log( 'data name:', this.name, proto.memo )
      //debugger
      if (_gen.memo[this.name] === undefined) {
        var ugen = this;
        _gen.requestMemory(this.memory, this.immutable);
        idx = this.memory.values.idx;
        if (this.buffer !== undefined) {
          try {
            _gen.memory.heap.set(this.buffer, idx);
          } catch (e) {
            console.log(e);
            throw Error('error with request. asking for ' + this.buffer.length + '. current index: ' + _gen.memoryIndex + ' of ' + _gen.memory.heap.length);
          }
        }
        //gen.data[ this.name ] = this
        //return 'gen.memory' + this.name + '.buffer'
        if (this.name.indexOf('data') === -1) {
          proto.memo[this.name] = idx;
        } else {
          _gen.memo[this.name] = idx;
        }
      } else {
        //console.log( 'using gen data memo', proto.memo[ this.name ] )
        idx = _gen.memo[this.name];
      }
      return idx;
    }
  };
  
  module.exports = function (x) {
    var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    var properties = arguments[2];
  
    var ugen = void 0,
        buffer = void 0,
        shouldLoad = false;
  
    if (properties !== undefined && properties.global !== undefined) {
      if (_gen.globals[properties.global]) {
        return _gen.globals[properties.global];
      }
    }
  
    if (typeof x === 'number') {
      if (y !== 1) {
        buffer = [];
        for (var i = 0; i < y; i++) {
          buffer[i] = new Float32Array(x);
        }
      } else {
        buffer = new Float32Array(x);
      }
    } else if (Array.isArray(x)) {
      //! (x instanceof Float32Array ) ) {
      var size = x.length;
      buffer = new Float32Array(size);
      for (var _i = 0; _i < x.length; _i++) {
        buffer[_i] = x[_i];
      }
    } else if (typeof x === 'string') {
      //buffer = { length: y > 1 ? y : gen.samplerate * 60 } // XXX what???
      //if( proto.memo[ x ] === undefined ) {
      buffer = { length: y > 1 ? y : 1 // XXX what???
      };shouldLoad = true;
      //}else{
      //buffer = proto.memo[ x ]
      //}
    } else if (x instanceof Float32Array) {
      buffer = x;
    }
  
    ugen = Object.create(proto);
  
    Object.assign(ugen, {
      buffer: buffer,
      name: proto.basename + _gen.getUID(),
      dim: buffer !== undefined ? buffer.length : 1, // XXX how do we dynamically allocate this?
      channels: 1,
      onload: null,
      //then( fnc ) {
      //  ugen.onload = fnc
      //  return ugen
      //},
      immutable: properties !== undefined && properties.immutable === true ? true : false,
      load: function load(filename, __resolve) {
        var promise = utilities.loadSample(filename, ugen);
        promise.then(function (_buffer) {
          proto.memo[x] = _buffer;
          ugen.name = filename;
          ugen.memory.values.length = ugen.dim = _buffer.length;
  
          _gen.requestMemory(ugen.memory, ugen.immutable);
          _gen.memory.heap.set(_buffer, ugen.memory.values.idx);
          if (typeof ugen.onload === 'function') ugen.onload(_buffer);
          __resolve(ugen);
        });
      },
  
      memory: {
        values: { length: buffer !== undefined ? buffer.length : 1, idx: null }
      }
    }, properties);
  
    if (properties !== undefined) {
      if (properties.global !== undefined) {
        _gen.globals[properties.global] = ugen;
      }
      if (properties.meta === true) {
        var _loop = function _loop(length, _i2) {
          Object.defineProperty(ugen, _i2, {
            get: function get() {
              return peek(ugen, _i2, { mode: 'simple', interp: 'none' });
            },
            set: function set(v) {
              return poke(ugen, v, _i2);
            }
          });
        };
  
        for (var _i2 = 0, length = ugen.buffer.length; _i2 < length; _i2++) {
          _loop(length, _i2);
        }
      }
    }
  
    var returnValue = void 0;
    if (shouldLoad === true) {
      returnValue = new Promise(function (resolve, reject) {
        //ugen.load( x, resolve )
        var promise = utilities.loadSample(x, ugen);
        promise.then(function (_buffer) {
          proto.memo[x] = _buffer;
          ugen.memory.values.length = ugen.dim = _buffer.length;
  
          ugen.buffer = _buffer;
          //gen.once( 'memory init', ()=> {
          //  console.log( "CALLED", ugen.memory )
          //  gen.requestMemory( ugen.memory, ugen.immutable ) 
          //  gen.memory.heap.set( _buffer, ugen.memory.values.idx )
          //  if( typeof ugen.onload === 'function' ) ugen.onload( _buffer ) 
          //})
  
          resolve(ugen);
        });
      });
    } else if (proto.memo[x] !== undefined) {
  
      _gen.once('memory init', function () {
        _gen.requestMemory(ugen.memory, ugen.immutable);
        _gen.memory.heap.set(ugen.buffer, ugen.memory.values.idx);
        if (typeof ugen.onload === 'function') ugen.onload(ugen.buffer);
      });
  
      returnValue = ugen;
    } else {
      returnValue = ugen;
    }
  
    return returnValue;
  };
  
  },{"./gen.js":32,"./peek.js":56,"./poke.js":58,"./utilities.js":75}],19:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      history = require('./history.js'),
      sub = require('./sub.js'),
      add = require('./add.js'),
      mul = require('./mul.js'),
      memo = require('./memo.js');
  
  module.exports = function (in1) {
      var x1 = history(),
          y1 = history(),
          filter = void 0;
  
      //History x1, y1; y = in1 - x1 + y1*0.9997; x1 = in1; y1 = y; out1 = y;
      filter = memo(add(sub(in1, x1.out), mul(y1.out, .9997)));
      x1.in(in1);
      y1.in(filter);
  
      return filter;
  };
  
  },{"./add.js":5,"./gen.js":32,"./history.js":36,"./memo.js":44,"./mul.js":50,"./sub.js":69}],20:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      history = require('./history.js'),
      mul = require('./mul.js'),
      t60 = require('./t60.js');
  
  module.exports = function () {
      var decayTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 44100;
      var props = arguments[1];
  
      var properties = Object.assign({}, { initValue: 1 }, props),
          ssd = history(properties.initValue);
  
      ssd.in(mul(ssd.out, t60(decayTime)));
  
      ssd.out.trigger = function () {
          ssd.value = 1;
      };
  
      return ssd.out;
  };
  
  },{"./gen.js":32,"./history.js":36,"./mul.js":50,"./t60.js":71}],21:[function(require,module,exports){
  'use strict';
  
  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
  
  var _gen = require('./gen.js'),
      data = require('./data.js'),
      poke = require('./poke.js'),
      peek = require('./peek.js'),
      sub = require('./sub.js'),
      wrap = require('./wrap.js'),
      accum = require('./accum.js'),
      memo = require('./memo.js');
  
  var proto = {
    basename: 'delay',
  
    gen: function gen() {
      var inputs = _gen.getInputs(this);
  
      _gen.memo[this.name] = inputs[0];
  
      return inputs[0];
    }
  };
  
  var defaults = { size: 512, interp: 'none' };
  
  module.exports = function (in1, taps, properties) {
    var ugen = Object.create(proto);
    var writeIdx = void 0,
        readIdx = void 0,
        delaydata = void 0;
  
    if (Array.isArray(taps) === false) taps = [taps];
  
    var props = Object.assign({}, defaults, properties);
  
    var maxTapSize = Math.max.apply(Math, _toConsumableArray(taps));
    if (props.size < maxTapSize) props.size = maxTapSize;
  
    delaydata = data(props.size);
  
    ugen.inputs = [];
  
    writeIdx = accum(1, 0, { max: props.size, min: 0 });
  
    for (var i = 0; i < taps.length; i++) {
      ugen.inputs[i] = peek(delaydata, wrap(sub(writeIdx, taps[i]), 0, props.size), { mode: 'samples', interp: props.interp });
    }
  
    ugen.outputs = ugen.inputs; // XXX ugh, Ugh, UGH! but i guess it works.
  
    poke(delaydata, in1, writeIdx);
  
    ugen.name = '' + ugen.basename + _gen.getUID();
  
    return ugen;
  };
  
  },{"./accum.js":2,"./data.js":18,"./gen.js":32,"./memo.js":44,"./peek.js":56,"./poke.js":58,"./sub.js":69,"./wrap.js":77}],22:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      history = require('./history.js'),
      sub = require('./sub.js');
  
  module.exports = function (in1) {
    var n1 = history();
  
    n1.in(in1);
  
    var ugen = sub(in1, n1.out);
    ugen.name = 'delta' + gen.getUID();
  
    return ugen;
  };
  
  },{"./gen.js":32,"./history.js":36,"./sub.js":69}],23:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'div',
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          out = '  var ' + this.name + ' = ',
          diff = 0,
          numCount = 0,
          lastNumber = inputs[0],
          lastNumberIsUgen = isNaN(lastNumber),
          divAtEnd = false;
  
      inputs.forEach(function (v, i) {
        if (i === 0) return;
  
        var isNumberUgen = isNaN(v),
            isFinalIdx = i === inputs.length - 1;
  
        if (!lastNumberIsUgen && !isNumberUgen) {
          lastNumber = lastNumber / v;
          out += lastNumber;
        } else {
          out += lastNumber + ' / ' + v;
        }
  
        if (!isFinalIdx) out += ' / ';
      });
  
      out += '\n';
  
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
    }
  };
  
  module.exports = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
  
    var div = Object.create(proto);
  
    Object.assign(div, {
      id: _gen.getUID(),
      inputs: args
    });
  
    div.name = div.basename + div.id;
  
    return div;
  };
  
  },{"./gen.js":32}],24:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen'),
      windows = require('./windows'),
      data = require('./data'),
      peek = require('./peek'),
      phasor = require('./phasor'),
      defaults = {
    type: 'triangular', length: 1024, alpha: .15, shift: 0, reverse: false
  };
  
  module.exports = function (props) {
  
    var properties = Object.assign({}, defaults, props);
    var buffer = new Float32Array(properties.length);
  
    var name = properties.type + '_' + properties.length + '_' + properties.shift + '_' + properties.reverse + '_' + properties.alpha;
    if (typeof gen.globals.windows[name] === 'undefined') {
  
      for (var i = 0; i < properties.length; i++) {
        buffer[i] = windows[properties.type](properties.length, i, properties.alpha, properties.shift);
      }
  
      if (properties.reverse === true) {
        buffer.reverse();
      }
      gen.globals.windows[name] = data(buffer);
    }
  
    var ugen = gen.globals.windows[name];
    ugen.name = 'env' + gen.getUID();
  
    return ugen;
  };
  
  },{"./data":18,"./gen":32,"./peek":56,"./phasor":57,"./windows":76}],25:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'eq',
  
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          out = void 0;
  
      out = this.inputs[0] === this.inputs[1] ? 1 : '  var ' + this.name + ' = (' + inputs[0] + ' === ' + inputs[1] + ') | 0\n\n';
  
      _gen.memo[this.name] = '' + this.name;
  
      return ['' + this.name, out];
    }
  };
  
  module.exports = function (in1, in2) {
    var ugen = Object.create(proto);
    Object.assign(ugen, {
      uid: _gen.getUID(),
      inputs: [in1, in2]
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./gen.js":32}],26:[function(require,module,exports){
  'use strict';
  
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'exp',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add(_defineProperty({}, this.name, isWorklet ? 'Math.exp' : Math.exp));
  
        out = ref + 'exp( ' + inputs[0] + ' )';
      } else {
        out = Math.exp(parseFloat(inputs[0]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var exp = Object.create(proto);
  
    exp.inputs = [x];
  
    return exp;
  };
  
  },{"./gen.js":32}],27:[function(require,module,exports){
  'use strict';
  
  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
  
  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
  
  /**
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not
   * use this file except in compliance with the License. You may obtain a copy of
   * the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
   * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
   * License for the specific language governing permissions and limitations under
   * the License.
   */
  
  // originally from:
  // https://github.com/GoogleChromeLabs/audioworklet-polyfill
  // I am modifying it to accept variable buffer sizes
  // and to get rid of some strange global initialization that seems required to use it
  // with browserify. Also, I added changes to fix a bug in Safari for the AudioWorkletProcessor
  // property not having a prototype (see:https://github.com/GoogleChromeLabs/audioworklet-polyfill/pull/25)
  // TODO: Why is there an iframe involved? (realm.js)
  
  var Realm = require('./realm.js');
  
  var AWPF = function AWPF() {
    var self = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window;
    var bufferSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4096;
  
    var PARAMS = [];
    var nextPort = void 0;
  
    if (typeof AudioWorkletNode !== 'function' || !("audioWorklet" in AudioContext.prototype)) {
      self.AudioWorkletNode = function AudioWorkletNode(context, name, options) {
        var processor = getProcessorsForContext(context)[name];
        var outputChannels = options && options.outputChannelCount ? options.outputChannelCount[0] : 2;
        var scriptProcessor = context.createScriptProcessor(bufferSize, 2, outputChannels);
  
        scriptProcessor.parameters = new Map();
        if (processor.properties) {
          for (var i = 0; i < processor.properties.length; i++) {
            var prop = processor.properties[i];
            var node = context.createGain().gain;
            node.value = prop.defaultValue;
            // @TODO there's no good way to construct the proxy AudioParam here
            scriptProcessor.parameters.set(prop.name, node);
          }
        }
  
        var mc = new MessageChannel();
        nextPort = mc.port2;
        var inst = new processor.Processor(options || {});
        nextPort = null;
  
        scriptProcessor.port = mc.port1;
        scriptProcessor.processor = processor;
        scriptProcessor.instance = inst;
        scriptProcessor.onaudioprocess = onAudioProcess;
        return scriptProcessor;
      };
  
      Object.defineProperty((self.AudioContext || self.webkitAudioContext).prototype, 'audioWorklet', {
        get: function get() {
          return this.$$audioWorklet || (this.$$audioWorklet = new self.AudioWorklet(this));
        }
      });
  
      /* XXX - ADDED TO OVERCOME PROBLEM IN SAFARI WHERE AUDIOWORKLETPROCESSOR PROTOTYPE IS NOT AN OBJECT */
      var AudioWorkletProcessor = function AudioWorkletProcessor() {
        this.port = nextPort;
      };
      AudioWorkletProcessor.prototype = {};
  
      self.AudioWorklet = function () {
        function AudioWorklet(audioContext) {
          _classCallCheck(this, AudioWorklet);
  
          this.$$context = audioContext;
        }
  
        _createClass(AudioWorklet, [{
          key: 'addModule',
          value: function addModule(url, options) {
            var _this = this;
  
            return fetch(url).then(function (r) {
              if (!r.ok) throw Error(r.status);
              return r.text();
            }).then(function (code) {
              var context = {
                sampleRate: _this.$$context.sampleRate,
                currentTime: _this.$$context.currentTime,
                AudioWorkletProcessor: AudioWorkletProcessor,
                registerProcessor: function registerProcessor(name, Processor) {
                  var processors = getProcessorsForContext(_this.$$context);
                  processors[name] = {
                    realm: realm,
                    context: context,
                    Processor: Processor,
                    properties: Processor.parameterDescriptors || []
                  };
                }
              };
  
              context.self = context;
              var realm = new Realm(context, document.documentElement);
              realm.exec((options && options.transpile || String)(code));
              return null;
            });
          }
        }]);
  
        return AudioWorklet;
      }();
    }
  
    function onAudioProcess(e) {
      var _this2 = this;
  
      var parameters = {};
      var index = -1;
      this.parameters.forEach(function (value, key) {
        var arr = PARAMS[++index] || (PARAMS[index] = new Float32Array(_this2.bufferSize));
        // @TODO proper values here if possible
        arr.fill(value.value);
        parameters[key] = arr;
      });
      this.processor.realm.exec('self.sampleRate=sampleRate=' + this.context.sampleRate + ';' + 'self.currentTime=currentTime=' + this.context.currentTime);
      var inputs = channelToArray(e.inputBuffer);
      var outputs = channelToArray(e.outputBuffer);
      this.instance.process([inputs], [outputs], parameters);
    }
  
    function channelToArray(ch) {
      var out = [];
      for (var i = 0; i < ch.numberOfChannels; i++) {
        out[i] = ch.getChannelData(i);
      }
      return out;
    }
  
    function getProcessorsForContext(audioContext) {
      return audioContext.$$processors || (audioContext.$$processors = {});
    }
  };
  
  module.exports = AWPF;
  
  },{"./realm.js":28}],28:[function(require,module,exports){
  'use strict';
  
  /**
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not
   * use this file except in compliance with the License. You may obtain a copy of
   * the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
   * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
   * License for the specific language governing permissions and limitations under
   * the License.
   */
  
  module.exports = function Realm(scope, parentElement) {
    var frame = document.createElement('iframe');
    frame.style.cssText = 'position:absolute;left:0;top:-999px;width:1px;height:1px;';
    parentElement.appendChild(frame);
    var win = frame.contentWindow;
    var doc = win.document;
    var vars = 'var window,$hook';
    for (var i in win) {
      if (!(i in scope) && i !== 'eval') {
        vars += ',';
        vars += i;
      }
    }
    for (var _i in scope) {
      vars += ',';
      vars += _i;
      vars += '=self.';
      vars += _i;
    }
    var script = doc.createElement('script');
    script.appendChild(doc.createTextNode('function $hook(self,console) {"use strict";\n        ' + vars + ';return function() {return eval(arguments[0])}}'));
    doc.body.appendChild(script);
    this.exec = win.$hook.call(scope, scope, console);
  };
  
  },{}],29:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'floor',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      if (isNaN(inputs[0])) {
        //gen.closures.add({ [ this.name ]: Math.floor })
  
        out = '( ' + inputs[0] + ' | 0 )';
      } else {
        out = inputs[0] | 0;
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var floor = Object.create(proto);
  
    floor.inputs = [x];
  
    return floor;
  };
  
  },{"./gen.js":32}],30:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'fold',
  
    gen: function gen() {
      var code = void 0,
          inputs = _gen.getInputs(this),
          out = void 0;
  
      out = this.createCallback(inputs[0], this.min, this.max);
  
      _gen.memo[this.name] = this.name + '_value';
  
      return [this.name + '_value', out];
    },
    createCallback: function createCallback(v, lo, hi) {
      var out = ' var ' + this.name + '_value = ' + v + ',\n      ' + this.name + '_range = ' + hi + ' - ' + lo + ',\n      ' + this.name + '_numWraps = 0\n\n  if(' + this.name + '_value >= ' + hi + '){\n    ' + this.name + '_value -= ' + this.name + '_range\n    if(' + this.name + '_value >= ' + hi + '){\n      ' + this.name + '_numWraps = ((' + this.name + '_value - ' + lo + ') / ' + this.name + '_range) | 0\n      ' + this.name + '_value -= ' + this.name + '_range * ' + this.name + '_numWraps\n    }\n    ' + this.name + '_numWraps++\n  } else if(' + this.name + '_value < ' + lo + '){\n    ' + this.name + '_value += ' + this.name + '_range\n    if(' + this.name + '_value < ' + lo + '){\n      ' + this.name + '_numWraps = ((' + this.name + '_value - ' + lo + ') / ' + this.name + '_range- 1) | 0\n      ' + this.name + '_value -= ' + this.name + '_range * ' + this.name + '_numWraps\n    }\n    ' + this.name + '_numWraps--\n  }\n  if(' + this.name + '_numWraps & 1) ' + this.name + '_value = ' + hi + ' + ' + lo + ' - ' + this.name + '_value\n';
      return ' ' + out;
    }
  };
  
  module.exports = function (in1) {
    var min = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var max = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  
    var ugen = Object.create(proto);
  
    Object.assign(ugen, {
      min: min,
      max: max,
      uid: _gen.getUID(),
      inputs: [in1]
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./gen.js":32}],31:[function(require,module,exports){
  'use strict';
  
  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'gate',
    controlString: null, // insert into output codegen for determining indexing
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          out = void 0;
  
      _gen.requestMemory(this.memory);
  
      var lastInputMemoryIdx = 'memory[ ' + this.memory.lastInput.idx + ' ]',
          outputMemoryStartIdx = this.memory.lastInput.idx + 1,
          inputSignal = inputs[0],
          controlSignal = inputs[1];
  
      /* 
       * we check to see if the current control inputs equals our last input
       * if so, we store the signal input in the memory associated with the currently
       * selected index. If not, we put 0 in the memory associated with the last selected index,
       * change the selected index, and then store the signal in put in the memery assoicated
       * with the newly selected index
       */
  
      out = ' if( ' + controlSignal + ' !== ' + lastInputMemoryIdx + ' ) {\n    memory[ ' + lastInputMemoryIdx + ' + ' + outputMemoryStartIdx + '  ] = 0 \n    ' + lastInputMemoryIdx + ' = ' + controlSignal + '\n  }\n  memory[ ' + outputMemoryStartIdx + ' + ' + controlSignal + ' ] = ' + inputSignal + '\n\n';
      this.controlString = inputs[1];
      this.initialized = true;
  
      _gen.memo[this.name] = this.name;
  
      this.outputs.forEach(function (v) {
        return v.gen();
      });
  
      return [null, ' ' + out];
    },
    childgen: function childgen() {
      if (this.parent.initialized === false) {
        _gen.getInputs(this); // parent gate is only input of a gate output, should only be gen'd once.
      }
  
      if (_gen.memo[this.name] === undefined) {
        _gen.requestMemory(this.memory);
  
        _gen.memo[this.name] = 'memory[ ' + this.memory.value.idx + ' ]';
      }
  
      return 'memory[ ' + this.memory.value.idx + ' ]';
    }
  };
  
  module.exports = function (control, in1, properties) {
    var ugen = Object.create(proto),
        defaults = { count: 2 };
  
    if ((typeof properties === 'undefined' ? 'undefined' : _typeof(properties)) !== undefined) Object.assign(defaults, properties);
  
    Object.assign(ugen, {
      outputs: [],
      uid: _gen.getUID(),
      inputs: [in1, control],
      memory: {
        lastInput: { length: 1, idx: null }
      },
      initialized: false
    }, defaults);
  
    ugen.name = '' + ugen.basename + _gen.getUID();
  
    for (var i = 0; i < ugen.count; i++) {
      ugen.outputs.push({
        index: i,
        gen: proto.childgen,
        parent: ugen,
        inputs: [ugen],
        memory: {
          value: { length: 1, idx: null }
        },
        initialized: false,
        name: ugen.name + '_out' + _gen.getUID()
      });
    }
  
    return ugen;
  };
  
  },{"./gen.js":32}],32:[function(require,module,exports){
  'use strict';
  
  /* gen.js
   *
   * low-level code generation for unit generators
   *
   */
  
  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
  
  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
  
  var MemoryHelper = require('memory-helper');
  var EE = require('events').EventEmitter;
  
  var gen = {
  
    accum: 0,
    getUID: function getUID() {
      return this.accum++;
    },
  
    debug: false,
    samplerate: 44100, // change on audiocontext creation
    shouldLocalize: false,
    graph: null,
    globals: {
      windows: {}
    },
    mode: 'worklet',
  
    /* closures
     *
     * Functions that are included as arguments to master callback. Examples: Math.abs, Math.random etc.
     * XXX Should probably be renamed callbackProperties or something similar... closures are no longer used.
     */
  
    closures: new Set(),
    params: new Set(),
    inputs: new Set(),
  
    parameters: new Set(),
    endBlock: new Set(),
    histories: new Map(),
  
    memo: {},
  
    //data: {},
  
    /* export
     *
     * place gen functions into another object for easier reference
     */
  
    export: function _export(obj) {},
    addToEndBlock: function addToEndBlock(v) {
      this.endBlock.add('  ' + v);
    },
    requestMemory: function requestMemory(memorySpec) {
      var immutable = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  
      for (var key in memorySpec) {
        var request = memorySpec[key];
  
        //console.log( 'requesting ' + key + ':' , JSON.stringify( request ) )
  
        if (request.length === undefined) {
          console.log('undefined length for:', key);
  
          continue;
        }
  
        request.idx = gen.memory.alloc(request.length, immutable);
      }
    },
    createMemory: function createMemory() {
      var amount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 4096;
      var type = arguments[1];
  
      var mem = MemoryHelper.create(amount, type);
      return mem;
    },
    createCallback: function createCallback(ugen, mem) {
      var debug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var shouldInlineMemory = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      var memType = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : Float64Array;
  
      var isStereo = Array.isArray(ugen) && ugen.length > 1,
          callback = void 0,
          channel1 = void 0,
          channel2 = void 0;
  
      if (typeof mem === 'number' || mem === undefined) {
        this.memory = this.createMemory(mem, memType);
      } else {
        this.memory = mem;
      }
  
      this.outputIdx = this.memory.alloc(2, true);
      this.emit('memory init');
  
      //console.log( 'cb memory:', mem )
      this.graph = ugen;
      this.memo = {};
      this.endBlock.clear();
      this.closures.clear();
      this.inputs.clear();
      this.params.clear();
      this.globals = { windows: {} };
  
      this.parameters.clear();
  
      this.functionBody = "  'use strict'\n";
      if (shouldInlineMemory === false) {
        this.functionBody += this.mode === 'worklet' ? "  var memory = this.memory\n\n" : "  var memory = gen.memory\n\n";
      }
  
      // call .gen() on the head of the graph we are generating the callback for
      //console.log( 'HEAD', ugen )
      for (var i = 0; i < 1 + isStereo; i++) {
        if (typeof ugen[i] === 'number') continue;
  
        //let channel = isStereo ? ugen[i].gen() : ugen.gen(),
        var channel = isStereo ? this.getInput(ugen[i]) : this.getInput(ugen),
            body = '';
  
        // if .gen() returns array, add ugen callback (graphOutput[1]) to our output functions body
        // and then return name of ugen. If .gen() only generates a number (for really simple graphs)
        // just return that number (graphOutput[0]).
        body += Array.isArray(channel) ? channel[1] + '\n' + channel[0] : channel;
  
        // split body to inject return keyword on last line
        body = body.split('\n');
  
        //if( debug ) console.log( 'functionBody length', body )
  
        // next line is to accommodate memo as graph head
        if (body[body.length - 1].trim().indexOf('let') > -1) {
          body.push('\n');
        }
  
        // get index of last line
        var lastidx = body.length - 1;
  
        // insert return keyword
        body[lastidx] = '  memory[' + (this.outputIdx + i) + ']  = ' + body[lastidx] + '\n';
  
        this.functionBody += body.join('\n');
      }
  
      this.histories.forEach(function (value) {
        if (value !== null) value.gen();
      });
  
      var returnStatement = isStereo ? '  return [ memory[' + this.outputIdx + '], memory[' + (this.outputIdx + 1) + '] ]' : '  return memory[' + this.outputIdx + ']';
  
      this.functionBody = this.functionBody.split('\n');
  
      if (this.endBlock.size) {
        this.functionBody = this.functionBody.concat(Array.from(this.endBlock));
        this.functionBody.push(returnStatement);
      } else {
        this.functionBody.push(returnStatement);
      }
      // reassemble function body
      this.functionBody = this.functionBody.join('\n');
  
      // we can only dynamically create a named function by dynamically creating another function
      // to construct the named function! sheesh...
      //
      if (shouldInlineMemory === true) {
        this.parameters.add('memory');
      }
  
      var paramString = '';
      if (this.mode === 'worklet') {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;
  
        try {
          for (var _iterator = this.parameters.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var name = _step.value;
  
            paramString += name + ',';
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
  
        paramString = paramString.slice(0, -1);
      }
  
      var separator = this.parameters.size !== 0 && this.inputs.size > 0 ? ', ' : '';
  
      var inputString = '';
      if (this.mode === 'worklet') {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;
  
        try {
          for (var _iterator2 = this.inputs.values()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _ugen = _step2.value;
  
            inputString += _ugen.name + ',';
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
  
        inputString = inputString.slice(0, -1);
      }
  
      var buildString = this.mode === 'worklet' ? 'return function( ' + inputString + ' ' + separator + ' ' + paramString + ' ){ \n' + this.functionBody + '\n}' : 'return function gen( ' + [].concat(_toConsumableArray(this.parameters)).join(',') + ' ){ \n' + this.functionBody + '\n}';
  
      if (this.debug || debug) console.log(buildString);
  
      callback = new Function(buildString)();
  
      // assign properties to named function
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;
  
      try {
        for (var _iterator3 = this.closures.values()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var dict = _step3.value;
  
          var _name = Object.keys(dict)[0],
              value = dict[_name];
  
          callback[_name] = value;
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
  
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;
  
      try {
        var _loop = function _loop() {
          var dict = _step4.value;
  
          var name = Object.keys(dict)[0],
              ugen = dict[name];
  
          Object.defineProperty(callback, name, {
            configurable: true,
            get: function get() {
              return ugen.value;
            },
            set: function set(v) {
              ugen.value = v;
            }
          });
          //callback[ name ] = value
        };
  
        for (var _iterator4 = this.params.values()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
  
      callback.members = this.closures;
      callback.data = this.data;
      callback.params = this.params;
      callback.inputs = this.inputs;
      callback.parameters = this.parameters; //.slice( 0 )
      callback.out = this.memory.heap.subarray(this.outputIdx, this.outputIdx + 2);
      callback.isStereo = isStereo;
  
      //if( MemoryHelper.isPrototypeOf( this.memory ) ) 
      callback.memory = this.memory.heap;
  
      this.histories.clear();
  
      return callback;
    },
  
  
    /* getInputs
     *
     * Called by each individual ugen when their .gen() method is called to resolve their various inputs.
     * If an input is a number, return the number. If
     * it is an ugen, call .gen() on the ugen, memoize the result and return the result. If the
     * ugen has previously been memoized return the memoized value.
     *
     */
    getInputs: function getInputs(ugen) {
      return ugen.inputs.map(gen.getInput);
    },
    getInput: function getInput(input) {
      var isObject = (typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object',
          processedInput = void 0;
  
      if (isObject) {
        // if input is a ugen... 
        //console.log( input.name, gen.memo[ input.name ] )
        if (gen.memo[input.name]) {
          // if it has been memoized...
          processedInput = gen.memo[input.name];
        } else if (Array.isArray(input)) {
          gen.getInput(input[0]);
          gen.getInput(input[1]);
        } else {
          // if not memoized generate code  
          if (typeof input.gen !== 'function') {
            console.log('no gen found:', input, input.gen);
            input = input.graph;
          }
          var code = input.gen();
          //if( code.indexOf( 'Object' ) > -1 ) console.log( 'bad input:', input, code )
  
          if (Array.isArray(code)) {
            if (!gen.shouldLocalize) {
              gen.functionBody += code[1];
            } else {
              gen.codeName = code[0];
              gen.localizedCode.push(code[1]);
            }
            //console.log( 'after GEN' , this.functionBody )
            processedInput = code[0];
          } else {
            processedInput = code;
          }
        }
      } else {
        // it input is a number
        processedInput = input;
      }
  
      return processedInput;
    },
    startLocalize: function startLocalize() {
      this.localizedCode = [];
      this.shouldLocalize = true;
    },
    endLocalize: function endLocalize() {
      this.shouldLocalize = false;
  
      return [this.codeName, this.localizedCode.slice(0)];
    },
    free: function free(graph) {
      if (Array.isArray(graph)) {
        // stereo ugen
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;
  
        try {
          for (var _iterator5 = graph[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var channel = _step5.value;
  
            this.free(channel);
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }
      } else {
        if ((typeof graph === 'undefined' ? 'undefined' : _typeof(graph)) === 'object') {
          if (graph.memory !== undefined) {
            for (var memoryKey in graph.memory) {
              this.memory.free(graph.memory[memoryKey].idx);
            }
          }
          if (Array.isArray(graph.inputs)) {
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;
  
            try {
              for (var _iterator6 = graph.inputs[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                var ugen = _step6.value;
  
                this.free(ugen);
              }
            } catch (err) {
              _didIteratorError6 = true;
              _iteratorError6 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion6 && _iterator6.return) {
                  _iterator6.return();
                }
              } finally {
                if (_didIteratorError6) {
                  throw _iteratorError6;
                }
              }
            }
          }
        }
      }
    }
  };
  
  gen.__proto__ = new EE();
  
  module.exports = gen;
  
  },{"events":78,"memory-helper":79}],33:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'gt',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      out = '  var ' + this.name + ' = ';
  
      if (isNaN(this.inputs[0]) || isNaN(this.inputs[1])) {
        out += '(( ' + inputs[0] + ' > ' + inputs[1] + ') | 0 )';
      } else {
        out += inputs[0] > inputs[1] ? 1 : 0;
      }
      out += '\n\n';
  
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
    }
  };
  
  module.exports = function (x, y) {
    var gt = Object.create(proto);
  
    gt.inputs = [x, y];
    gt.name = gt.basename + _gen.getUID();
  
    return gt;
  };
  
  },{"./gen.js":32}],34:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'gte',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      out = '  var ' + this.name + ' = ';
  
      if (isNaN(this.inputs[0]) || isNaN(this.inputs[1])) {
        out += '( ' + inputs[0] + ' >= ' + inputs[1] + ' | 0 )';
      } else {
        out += inputs[0] >= inputs[1] ? 1 : 0;
      }
      out += '\n\n';
  
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
    }
  };
  
  module.exports = function (x, y) {
    var gt = Object.create(proto);
  
    gt.inputs = [x, y];
    gt.name = 'gte' + _gen.getUID();
  
    return gt;
  };
  
  },{"./gen.js":32}],35:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'gtp',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      if (isNaN(this.inputs[0]) || isNaN(this.inputs[1])) {
        out = '(' + inputs[0] + ' * ( ( ' + inputs[0] + ' > ' + inputs[1] + ' ) | 0 ) )';
      } else {
        out = inputs[0] * (inputs[0] > inputs[1] | 0);
      }
  
      return out;
    }
  };
  
  module.exports = function (x, y) {
    var gtp = Object.create(proto);
  
    gtp.inputs = [x, y];
  
    return gtp;
  };
  
  },{"./gen.js":32}],36:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  module.exports = function () {
    var in1 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  
    var ugen = {
      inputs: [in1],
      memory: { value: { length: 1, idx: null } },
      recorder: null,
  
      in: function _in(v) {
        if (_gen.histories.has(v)) {
          var memoHistory = _gen.histories.get(v);
          ugen.name = memoHistory.name;
          return memoHistory;
        }
  
        var obj = {
          gen: function gen() {
            var inputs = _gen.getInputs(ugen);
  
            if (ugen.memory.value.idx === null) {
              _gen.requestMemory(ugen.memory);
              _gen.memory.heap[ugen.memory.value.idx] = in1;
            }
  
            var idx = ugen.memory.value.idx;
  
            _gen.addToEndBlock('memory[ ' + idx + ' ] = ' + inputs[0]);
  
            // return ugen that is being recorded instead of ssd.
            // this effectively makes a call to ssd.record() transparent to the graph.
            // recording is triggered by prior call to gen.addToEndBlock.
            _gen.histories.set(v, obj);
  
            return inputs[0];
          },
  
          name: ugen.name + '_in' + _gen.getUID(),
          memory: ugen.memory
        };
  
        this.inputs[0] = v;
  
        ugen.recorder = obj;
  
        return obj;
      },
  
  
      out: {
        gen: function gen() {
          if (ugen.memory.value.idx === null) {
            if (_gen.histories.get(ugen.inputs[0]) === undefined) {
              _gen.histories.set(ugen.inputs[0], ugen.recorder);
            }
            _gen.requestMemory(ugen.memory);
            _gen.memory.heap[ugen.memory.value.idx] = parseFloat(in1);
          }
          var idx = ugen.memory.value.idx;
  
          return 'memory[ ' + idx + ' ] ';
        }
      },
  
      uid: _gen.getUID()
    };
  
    ugen.out.memory = ugen.memory;
  
    ugen.name = 'history' + ugen.uid;
    ugen.out.name = ugen.name + '_out';
    ugen.in._name = ugen.name = '_in';
  
    Object.defineProperty(ugen, 'value', {
      get: function get() {
        if (this.memory.value.idx !== null) {
          return _gen.memory.heap[this.memory.value.idx];
        }
      },
      set: function set(v) {
        if (this.memory.value.idx !== null) {
          _gen.memory.heap[this.memory.value.idx] = v;
        }
      }
    });
  
    return ugen;
  };
  
  },{"./gen.js":32}],37:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'ifelse',
  
    gen: function gen() {
      var conditionals = this.inputs[0],
          defaultValue = _gen.getInput(conditionals[conditionals.length - 1]),
          out = '  var ' + this.name + '_out = ' + defaultValue + '\n';
  
      //console.log( 'conditionals:', this.name, conditionals )
  
      //console.log( 'defaultValue:', defaultValue )
  
      for (var i = 0; i < conditionals.length - 2; i += 2) {
        var isEndBlock = i === conditionals.length - 3,
            cond = _gen.getInput(conditionals[i]),
            preblock = conditionals[i + 1],
            block = void 0,
            blockName = void 0,
            output = void 0;
  
        //console.log( 'pb', preblock )
  
        if (typeof preblock === 'number') {
          block = preblock;
          blockName = null;
        } else {
          if (_gen.memo[preblock.name] === undefined) {
            // used to place all code dependencies in appropriate blocks
            _gen.startLocalize();
  
            _gen.getInput(preblock);
  
            block = _gen.endLocalize();
            blockName = block[0];
            block = block[1].join('');
            block = '  ' + block.replace(/\n/gi, '\n  ');
          } else {
            block = '';
            blockName = _gen.memo[preblock.name];
          }
        }
  
        output = blockName === null ? '  ' + this.name + '_out = ' + block : block + '  ' + this.name + '_out = ' + blockName;
  
        if (i === 0) out += ' ';
        out += ' if( ' + cond + ' === 1 ) {\n' + output + '\n  }';
  
        if (!isEndBlock) {
          out += ' else';
        } else {
          out += '\n';
        }
      }
  
      _gen.memo[this.name] = this.name + '_out';
  
      return [this.name + '_out', out];
    }
  };
  
  module.exports = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
  
    var ugen = Object.create(proto),
        conditions = Array.isArray(args[0]) ? args[0] : args;
  
    Object.assign(ugen, {
      uid: _gen.getUID(),
      inputs: [conditions]
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./gen.js":32}],38:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'in',
  
    gen: function gen() {
      var isWorklet = _gen.mode === 'worklet';
  
      if (isWorklet) {
        _gen.inputs.add(this);
      } else {
        _gen.parameters.add(this.name);
      }
  
      _gen.memo[this.name] = isWorklet === true ? this.name + '[i]' : this.name;
  
      return _gen.memo[this.name];
    }
  };
  
  module.exports = function (name) {
    var inputNumber = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var channelNumber = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var defaultValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var min = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var max = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
  
    var input = Object.create(proto);
  
    input.id = _gen.getUID();
    input.name = name !== undefined ? name : '' + input.basename + input.id;
    Object.assign(input, { defaultValue: defaultValue, min: min, max: max, inputNumber: inputNumber, channelNumber: channelNumber });
  
    input[0] = {
      gen: function gen() {
        if (!_gen.parameters.has(input.name)) _gen.parameters.add(input.name);
        return input.name + '[0]';
      }
    };
    input[1] = {
      gen: function gen() {
        if (!_gen.parameters.has(input.name)) _gen.parameters.add(input.name);
        return input.name + '[1]';
      }
    };
  
    return input;
  };
  
  },{"./gen.js":32}],39:[function(require,module,exports){
  'use strict';
  
  var library = {
    export: function _export(destination) {
      if (destination === window) {
        destination.ssd = library.history; // history is window object property, so use ssd as alias
        destination.input = library.in; // in is a keyword in javascript
        destination.ternary = library.switch; // switch is a keyword in javascript
  
        delete library.history;
        delete library.in;
        delete library.switch;
      }
  
      Object.assign(destination, library);
  
      Object.defineProperty(library, 'samplerate', {
        get: function get() {
          return library.gen.samplerate;
        },
        set: function set(v) {}
      });
  
      library.in = destination.input;
      library.history = destination.ssd;
      library.switch = destination.ternary;
  
      destination.clip = library.clamp;
    },
  
  
    gen: require('./gen.js'),
  
    abs: require('./abs.js'),
    round: require('./round.js'),
    param: require('./param.js'),
    add: require('./add.js'),
    sub: require('./sub.js'),
    mul: require('./mul.js'),
    div: require('./div.js'),
    accum: require('./accum.js'),
    counter: require('./counter.js'),
    sin: require('./sin.js'),
    cos: require('./cos.js'),
    tan: require('./tan.js'),
    tanh: require('./tanh.js'),
    asin: require('./asin.js'),
    acos: require('./acos.js'),
    atan: require('./atan.js'),
    phasor: require('./phasor.js'),
    data: require('./data.js'),
    peek: require('./peek.js'),
    cycle: require('./cycle.js'),
    history: require('./history.js'),
    delta: require('./delta.js'),
    floor: require('./floor.js'),
    ceil: require('./ceil.js'),
    min: require('./min.js'),
    max: require('./max.js'),
    sign: require('./sign.js'),
    dcblock: require('./dcblock.js'),
    memo: require('./memo.js'),
    rate: require('./rate.js'),
    wrap: require('./wrap.js'),
    mix: require('./mix.js'),
    clamp: require('./clamp.js'),
    poke: require('./poke.js'),
    delay: require('./delay.js'),
    fold: require('./fold.js'),
    mod: require('./mod.js'),
    sah: require('./sah.js'),
    noise: require('./noise.js'),
    not: require('./not.js'),
    gt: require('./gt.js'),
    gte: require('./gte.js'),
    lt: require('./lt.js'),
    lte: require('./lte.js'),
    bool: require('./bool.js'),
    gate: require('./gate.js'),
    train: require('./train.js'),
    slide: require('./slide.js'),
    in: require('./in.js'),
    t60: require('./t60.js'),
    mtof: require('./mtof.js'),
    ltp: require('./ltp.js'), // TODO: test
    gtp: require('./gtp.js'), // TODO: test
    switch: require('./switch.js'),
    mstosamps: require('./mstosamps.js'), // TODO: needs test,
    selector: require('./selector.js'),
    utilities: require('./utilities.js'),
    pow: require('./pow.js'),
    attack: require('./attack.js'),
    decay: require('./decay.js'),
    windows: require('./windows.js'),
    env: require('./env.js'),
    ad: require('./ad.js'),
    adsr: require('./adsr.js'),
    ifelse: require('./ifelseif.js'),
    bang: require('./bang.js'),
    and: require('./and.js'),
    pan: require('./pan.js'),
    eq: require('./eq.js'),
    neq: require('./neq.js'),
    exp: require('./exp.js'),
    process: require('./process.js'),
    seq: require('./seq.js')
  };
  
  library.gen.lib = library;
  
  module.exports = library;
  
  },{"./abs.js":1,"./accum.js":2,"./acos.js":3,"./ad.js":4,"./add.js":5,"./adsr.js":6,"./and.js":7,"./asin.js":8,"./atan.js":9,"./attack.js":10,"./bang.js":11,"./bool.js":12,"./ceil.js":13,"./clamp.js":14,"./cos.js":15,"./counter.js":16,"./cycle.js":17,"./data.js":18,"./dcblock.js":19,"./decay.js":20,"./delay.js":21,"./delta.js":22,"./div.js":23,"./env.js":24,"./eq.js":25,"./exp.js":26,"./floor.js":29,"./fold.js":30,"./gate.js":31,"./gen.js":32,"./gt.js":33,"./gte.js":34,"./gtp.js":35,"./history.js":36,"./ifelseif.js":37,"./in.js":38,"./lt.js":40,"./lte.js":41,"./ltp.js":42,"./max.js":43,"./memo.js":44,"./min.js":45,"./mix.js":46,"./mod.js":47,"./mstosamps.js":48,"./mtof.js":49,"./mul.js":50,"./neq.js":51,"./noise.js":52,"./not.js":53,"./pan.js":54,"./param.js":55,"./peek.js":56,"./phasor.js":57,"./poke.js":58,"./pow.js":59,"./process.js":60,"./rate.js":61,"./round.js":62,"./sah.js":63,"./selector.js":64,"./seq.js":65,"./sign.js":66,"./sin.js":67,"./slide.js":68,"./sub.js":69,"./switch.js":70,"./t60.js":71,"./tan.js":72,"./tanh.js":73,"./train.js":74,"./utilities.js":75,"./windows.js":76,"./wrap.js":77}],40:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'lt',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      out = '  var ' + this.name + ' = ';
  
      if (isNaN(this.inputs[0]) || isNaN(this.inputs[1])) {
        out += '(( ' + inputs[0] + ' < ' + inputs[1] + ') | 0  )';
      } else {
        out += inputs[0] < inputs[1] ? 1 : 0;
      }
      out += '\n';
  
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
  
      return out;
    }
  };
  
  module.exports = function (x, y) {
    var lt = Object.create(proto);
  
    lt.inputs = [x, y];
    lt.name = lt.basename + _gen.getUID();
  
    return lt;
  };
  
  },{"./gen.js":32}],41:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'lte',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      out = '  var ' + this.name + ' = ';
  
      if (isNaN(this.inputs[0]) || isNaN(this.inputs[1])) {
        out += '( ' + inputs[0] + ' <= ' + inputs[1] + ' | 0  )';
      } else {
        out += inputs[0] <= inputs[1] ? 1 : 0;
      }
      out += '\n';
  
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
  
      return out;
    }
  };
  
  module.exports = function (x, y) {
    var lt = Object.create(proto);
  
    lt.inputs = [x, y];
    lt.name = 'lte' + _gen.getUID();
  
    return lt;
  };
  
  },{"./gen.js":32}],42:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'ltp',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      if (isNaN(this.inputs[0]) || isNaN(this.inputs[1])) {
        out = '(' + inputs[0] + ' * (( ' + inputs[0] + ' < ' + inputs[1] + ' ) | 0 ) )';
      } else {
        out = inputs[0] * (inputs[0] < inputs[1] | 0);
      }
  
      return out;
    }
  };
  
  module.exports = function (x, y) {
    var ltp = Object.create(proto);
  
    ltp.inputs = [x, y];
  
    return ltp;
  };
  
  },{"./gen.js":32}],43:[function(require,module,exports){
  'use strict';
  
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'max',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0]) || isNaN(inputs[1])) {
        _gen.closures.add(_defineProperty({}, this.name, isWorklet ? 'Math.max' : Math.max));
  
        out = ref + 'max( ' + inputs[0] + ', ' + inputs[1] + ' )';
      } else {
        out = Math.max(parseFloat(inputs[0]), parseFloat(inputs[1]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x, y) {
    var max = Object.create(proto);
  
    max.inputs = [x, y];
  
    return max;
  };
  
  },{"./gen.js":32}],44:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'memo',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      out = '  var ' + this.name + ' = ' + inputs[0] + '\n';
  
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
    }
  };
  
  module.exports = function (in1, memoName) {
    var memo = Object.create(proto);
  
    memo.inputs = [in1];
    memo.id = _gen.getUID();
    memo.name = memoName !== undefined ? memoName + '_' + _gen.getUID() : '' + memo.basename + memo.id;
  
    return memo;
  };
  
  },{"./gen.js":32}],45:[function(require,module,exports){
  'use strict';
  
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'min',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0]) || isNaN(inputs[1])) {
        _gen.closures.add(_defineProperty({}, this.name, isWorklet ? 'Math.min' : Math.min));
  
        out = ref + 'min( ' + inputs[0] + ', ' + inputs[1] + ' )';
      } else {
        out = Math.min(parseFloat(inputs[0]), parseFloat(inputs[1]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x, y) {
    var min = Object.create(proto);
  
    min.inputs = [x, y];
  
    return min;
  };
  
  },{"./gen.js":32}],46:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      add = require('./add.js'),
      mul = require('./mul.js'),
      sub = require('./sub.js'),
      memo = require('./memo.js');
  
  module.exports = function (in1, in2) {
      var t = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : .5;
  
      var ugen = memo(add(mul(in1, sub(1, t)), mul(in2, t)));
      ugen.name = 'mix' + gen.getUID();
  
      return ugen;
  };
  
  },{"./add.js":5,"./gen.js":32,"./memo.js":44,"./mul.js":50,"./sub.js":69}],47:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  module.exports = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
  
    var mod = {
      id: _gen.getUID(),
      inputs: args,
  
      gen: function gen() {
        var inputs = _gen.getInputs(this),
            out = '(',
            diff = 0,
            numCount = 0,
            lastNumber = inputs[0],
            lastNumberIsUgen = isNaN(lastNumber),
            modAtEnd = false;
  
        inputs.forEach(function (v, i) {
          if (i === 0) return;
  
          var isNumberUgen = isNaN(v),
              isFinalIdx = i === inputs.length - 1;
  
          if (!lastNumberIsUgen && !isNumberUgen) {
            lastNumber = lastNumber % v;
            out += lastNumber;
          } else {
            out += lastNumber + ' % ' + v;
          }
  
          if (!isFinalIdx) out += ' % ';
        });
  
        out += ')';
  
        return out;
      }
    };
  
    return mod;
  };
  
  },{"./gen.js":32}],48:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'mstosamps',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this),
          returnValue = void 0;
  
      if (isNaN(inputs[0])) {
        out = '  var ' + this.name + ' = ' + _gen.samplerate + ' / 1000 * ' + inputs[0] + ' \n\n';
  
        _gen.memo[this.name] = out;
  
        returnValue = [this.name, out];
      } else {
        out = _gen.samplerate / 1000 * this.inputs[0];
  
        returnValue = out;
      }
  
      return returnValue;
    }
  };
  
  module.exports = function (x) {
    var mstosamps = Object.create(proto);
  
    mstosamps.inputs = [x];
    mstosamps.name = proto.basename + _gen.getUID();
  
    return mstosamps;
  };
  
  },{"./gen.js":32}],49:[function(require,module,exports){
  'use strict';
  
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'mtof',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      if (isNaN(inputs[0])) {
        _gen.closures.add(_defineProperty({}, this.name, Math.exp));
  
        out = '( ' + this.tuning + ' * gen.exp( .057762265 * (' + inputs[0] + ' - 69) ) )';
      } else {
        out = this.tuning * Math.exp(.057762265 * (inputs[0] - 69));
      }
  
      return out;
    }
  };
  
  module.exports = function (x, props) {
    var ugen = Object.create(proto),
        defaults = { tuning: 440 };
  
    if (props !== undefined) Object.assign(props.defaults);
  
    Object.assign(ugen, defaults);
    ugen.inputs = [x];
  
    return ugen;
  };
  
  },{"./gen.js":32}],50:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'mul',
  
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          out = '  var ' + this.name + ' = ',
          sum = 1,
          numCount = 0,
          mulAtEnd = false,
          alreadyFullSummed = true;
  
      inputs.forEach(function (v, i) {
        if (isNaN(v)) {
          out += v;
          if (i < inputs.length - 1) {
            mulAtEnd = true;
            out += ' * ';
          }
          alreadyFullSummed = false;
        } else {
          if (i === 0) {
            sum = v;
          } else {
            sum *= parseFloat(v);
          }
          numCount++;
        }
      });
  
      if (numCount > 0) {
        out += mulAtEnd || alreadyFullSummed ? sum : ' * ' + sum;
      }
  
      out += '\n';
  
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
    }
  };
  
  module.exports = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
  
    var mul = Object.create(proto);
  
    Object.assign(mul, {
      id: _gen.getUID(),
      inputs: args
    });
  
    mul.name = mul.basename + mul.id;
  
    return mul;
  };
  
  },{"./gen.js":32}],51:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'neq',
  
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          out = void 0;
  
      out = /*this.inputs[0] !== this.inputs[1] ? 1 :*/'  var ' + this.name + ' = (' + inputs[0] + ' !== ' + inputs[1] + ') | 0\n\n';
  
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
    }
  };
  
  module.exports = function (in1, in2) {
    var ugen = Object.create(proto);
    Object.assign(ugen, {
      uid: _gen.getUID(),
      inputs: [in1, in2]
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./gen.js":32}],52:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'noise',
  
    gen: function gen() {
      var out = void 0;
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      _gen.closures.add({ 'noise': isWorklet ? 'Math.random' : Math.random });
  
      out = '  var ' + this.name + ' = ' + ref + 'noise()\n';
  
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
    }
  };
  
  module.exports = function (x) {
    var noise = Object.create(proto);
    noise.name = proto.name + _gen.getUID();
  
    return noise;
  };
  
  },{"./gen.js":32}],53:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'not',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      if (isNaN(this.inputs[0])) {
        out = '( ' + inputs[0] + ' === 0 ? 1 : 0 )';
      } else {
        out = !inputs[0] === 0 ? 1 : 0;
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var not = Object.create(proto);
  
    not.inputs = [x];
  
    return not;
  };
  
  },{"./gen.js":32}],54:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      data = require('./data.js'),
      peek = require('./peek.js'),
      mul = require('./mul.js');
  
  var proto = {
    basename: 'pan',
    initTable: function initTable() {
      var bufferL = new Float32Array(1024),
          bufferR = new Float32Array(1024);
  
      var angToRad = Math.PI / 180;
      for (var i = 0; i < 1024; i++) {
        var pan = i * (90 / 1024);
        bufferL[i] = Math.cos(pan * angToRad);
        bufferR[i] = Math.sin(pan * angToRad);
      }
  
      gen.globals.panL = data(bufferL, 1, { immutable: true });
      gen.globals.panR = data(bufferR, 1, { immutable: true });
    }
  };
  
  module.exports = function (leftInput, rightInput) {
    var pan = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : .5;
    var properties = arguments[3];
  
    if (gen.globals.panL === undefined) proto.initTable();
  
    var ugen = Object.create(proto);
  
    Object.assign(ugen, {
      uid: gen.getUID(),
      inputs: [leftInput, rightInput],
      left: mul(leftInput, peek(gen.globals.panL, pan, { boundmode: 'clamp' })),
      right: mul(rightInput, peek(gen.globals.panR, pan, { boundmode: 'clamp' }))
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./data.js":18,"./gen.js":32,"./mul.js":50,"./peek.js":56}],55:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'param',
  
    gen: function gen() {
      _gen.requestMemory(this.memory);
  
      _gen.params.add(this);
  
      var isWorklet = _gen.mode === 'worklet';
  
      if (isWorklet) _gen.parameters.add(this.name);
  
      this.value = this.initialValue;
  
      _gen.memo[this.name] = isWorklet ? this.name : 'memory[' + this.memory.value.idx + ']';
  
      return _gen.memo[this.name];
    }
  };
  
  module.exports = function () {
    var propName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var min = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var max = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
  
    var ugen = Object.create(proto);
  
    if (typeof propName !== 'string') {
      ugen.name = ugen.basename + _gen.getUID();
      ugen.initialValue = propName;
    } else {
      ugen.name = propName;
      ugen.initialValue = value;
    }
  
    ugen.min = min;
    ugen.max = max;
    ugen.defaultValue = ugen.initialValue;
  
    // for storing worklet nodes once they're instantiated
    ugen.waapi = null;
  
    ugen.isWorklet = _gen.mode === 'worklet';
  
    Object.defineProperty(ugen, 'value', {
      get: function get() {
        if (this.memory.value.idx !== null) {
          return _gen.memory.heap[this.memory.value.idx];
        } else {
          return this.initialValue;
        }
      },
      set: function set(v) {
        if (this.memory.value.idx !== null) {
          if (this.isWorklet && this.waapi !== null) {
            this.waapi.value = v;
          } else {
            _gen.memory.heap[this.memory.value.idx] = v;
          }
        }
      }
    });
  
    ugen.memory = {
      value: { length: 1, idx: null }
    };
  
    return ugen;
  };
  
  },{"./gen.js":32}],56:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js'),
      dataUgen = require('./data.js');
  
  var proto = {
    basename: 'peek',
  
    gen: function gen() {
      var genName = 'gen.' + this.name,
          inputs = _gen.getInputs(this),
          out = void 0,
          functionBody = void 0,
          next = void 0,
          lengthIsLog2 = void 0,
          idx = void 0;
  
      idx = inputs[1];
      lengthIsLog2 = (Math.log2(this.data.buffer.length) | 0) === Math.log2(this.data.buffer.length);
  
      if (this.mode !== 'simple') {
  
        functionBody = '  var ' + this.name + '_dataIdx  = ' + idx + ', \n      ' + this.name + '_phase = ' + (this.mode === 'samples' ? inputs[0] : inputs[0] + ' * ' + this.data.buffer.length) + ', \n      ' + this.name + '_index = ' + this.name + '_phase | 0,\n';
  
        if (this.boundmode === 'wrap') {
          next = lengthIsLog2 ? '( ' + this.name + '_index + 1 ) & (' + this.data.buffer.length + ' - 1)' : this.name + '_index + 1 >= ' + this.data.buffer.length + ' ? ' + this.name + '_index + 1 - ' + this.data.buffer.length + ' : ' + this.name + '_index + 1';
        } else if (this.boundmode === 'clamp') {
          next = this.name + '_index + 1 >= ' + (this.data.buffer.length - 1) + ' ? ' + (this.data.buffer.length - 1) + ' : ' + this.name + '_index + 1';
        } else if (this.boundmode === 'fold' || this.boundmode === 'mirror') {
          next = this.name + '_index + 1 >= ' + (this.data.buffer.length - 1) + ' ? ' + this.name + '_index - ' + (this.data.buffer.length - 1) + ' : ' + this.name + '_index + 1';
        } else {
          next = this.name + '_index + 1';
        }
  
        if (this.interp === 'linear') {
          functionBody += '      ' + this.name + '_frac  = ' + this.name + '_phase - ' + this.name + '_index,\n      ' + this.name + '_base  = memory[ ' + this.name + '_dataIdx +  ' + this.name + '_index ],\n      ' + this.name + '_next  = ' + next + ',';
  
          if (this.boundmode === 'ignore') {
            functionBody += '\n      ' + this.name + '_out   = ' + this.name + '_index >= ' + (this.data.buffer.length - 1) + ' || ' + this.name + '_index < 0 ? 0 : ' + this.name + '_base + ' + this.name + '_frac * ( memory[ ' + this.name + '_dataIdx + ' + this.name + '_next ] - ' + this.name + '_base )\n\n';
          } else {
            functionBody += '\n      ' + this.name + '_out   = ' + this.name + '_base + ' + this.name + '_frac * ( memory[ ' + this.name + '_dataIdx + ' + this.name + '_next ] - ' + this.name + '_base )\n\n';
          }
        } else {
          functionBody += '      ' + this.name + '_out = memory[ ' + this.name + '_dataIdx + ' + this.name + '_index ]\n\n';
        }
      } else {
        // mode is simple
        functionBody = 'memory[ ' + idx + ' + ' + inputs[0] + ' ]';
  
        return functionBody;
      }
  
      _gen.memo[this.name] = this.name + '_out';
  
      return [this.name + '_out', functionBody];
    },
  
  
    defaults: { channels: 1, mode: 'phase', interp: 'linear', boundmode: 'wrap' }
  };
  
  module.exports = function (input_data) {
    var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var properties = arguments[2];
  
    var ugen = Object.create(proto);
  
    //console.log( dataUgen, gen.data )
  
    // XXX why is dataUgen not the actual function? some type of browserify nonsense...
    var finalData = typeof input_data.basename === 'undefined' ? _gen.lib.data(input_data) : input_data;
  
    Object.assign(ugen, {
      'data': finalData,
      dataName: finalData.name,
      uid: _gen.getUID(),
      inputs: [index, finalData]
    }, proto.defaults, properties);
  
    ugen.name = ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./data.js":18,"./gen.js":32}],57:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      accum = require('./accum.js'),
      mul = require('./mul.js'),
      proto = { basename: 'phasor' },
      div = require('./div.js');
  
  var defaults = { min: -1, max: 1 };
  
  module.exports = function () {
    var frequency = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var reset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var _props = arguments[2];
  
    var props = Object.assign({}, defaults, _props);
  
    var range = props.max - props.min;
  
    var ugen = typeof frequency === 'number' ? accum(frequency * range / gen.samplerate, reset, props) : accum(div(mul(frequency, range), gen.samplerate), reset, props);
  
    ugen.name = proto.basename + gen.getUID();
  
    return ugen;
  };
  
  },{"./accum.js":2,"./div.js":23,"./gen.js":32,"./mul.js":50}],58:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js'),
      mul = require('./mul.js'),
      wrap = require('./wrap.js');
  
  var proto = {
    basename: 'poke',
  
    gen: function gen() {
      var dataName = 'memory',
          inputs = _gen.getInputs(this),
          idx = void 0,
          out = void 0,
          wrapped = void 0;
  
      idx = this.data.gen();
  
      //gen.requestMemory( this.memory )
      //wrapped = wrap( this.inputs[1], 0, this.dataLength ).gen()
      //idx = wrapped[0]
      //gen.functionBody += wrapped[1]
      var outputStr = this.inputs[1] === 0 ? '  ' + dataName + '[ ' + idx + ' ] = ' + inputs[0] + '\n' : '  ' + dataName + '[ ' + idx + ' + ' + inputs[1] + ' ] = ' + inputs[0] + '\n';
  
      if (this.inline === undefined) {
        _gen.functionBody += outputStr;
      } else {
        return [this.inline, outputStr];
      }
    }
  };
  module.exports = function (data, value, index, properties) {
    var ugen = Object.create(proto),
        defaults = { channels: 1 };
  
    if (properties !== undefined) Object.assign(defaults, properties);
  
    Object.assign(ugen, {
      data: data,
      dataName: data.name,
      dataLength: data.buffer.length,
      uid: _gen.getUID(),
      inputs: [value, index]
    }, defaults);
  
    ugen.name = ugen.basename + ugen.uid;
  
    _gen.histories.set(ugen.name, ugen);
  
    return ugen;
  };
  
  },{"./gen.js":32,"./mul.js":50,"./wrap.js":77}],59:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'pow',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0]) || isNaN(inputs[1])) {
        _gen.closures.add({ 'pow': isWorklet ? 'Math.pow' : Math.pow });
  
        out = ref + 'pow( ' + inputs[0] + ', ' + inputs[1] + ' )';
      } else {
        if (typeof inputs[0] === 'string' && inputs[0][0] === '(') {
          inputs[0] = inputs[0].slice(1, -1);
        }
        if (typeof inputs[1] === 'string' && inputs[1][0] === '(') {
          inputs[1] = inputs[1].slice(1, -1);
        }
  
        out = Math.pow(parseFloat(inputs[0]), parseFloat(inputs[1]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x, y) {
    var pow = Object.create(proto);
  
    pow.inputs = [x, y];
    pow.id = _gen.getUID();
    pow.name = pow.basename + '{pow.id}';
  
    return pow;
  };
  
  },{"./gen.js":32}],60:[function(require,module,exports){
  'use strict';
  
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  var _gen = require('./gen.js');
  var proto = {
    basename: 'process',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      _gen.closures.add(_defineProperty({}, '' + this.funcname, this.func));
  
      out = '  var ' + this.name + ' = gen[\'' + this.funcname + '\'](';
  
      inputs.forEach(function (v, i, arr) {
        out += arr[i];
        if (i < arr.length - 1) out += ',';
      });
  
      out += ')\n';
  
      _gen.memo[this.name] = this.name;
  
      return [this.name, out];
  
      return out;
    }
  };
  
  module.exports = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
  
    var process = {}; // Object.create( proto )
    var id = _gen.getUID();
    process.name = 'process' + id;
  
    process.func = new (Function.prototype.bind.apply(Function, [null].concat(args)))();
  
    //gen.globals[ process.name ] = process.func
  
    process.call = function () {
      var output = Object.create(proto);
      output.funcname = process.name;
      output.func = process.func;
      output.name = 'process_out_' + id;
      output.process = process;
  
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
  
      output.inputs = args;
  
      return output;
    };
  
    return process;
  };
  
  },{"./gen.js":32}],61:[function(require,module,exports){
  'use strict';
  
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  var _gen = require('./gen.js'),
      history = require('./history.js'),
      sub = require('./sub.js'),
      add = require('./add.js'),
      mul = require('./mul.js'),
      memo = require('./memo.js'),
      delta = require('./delta.js'),
      wrap = require('./wrap.js');
  
  var proto = {
    basename: 'rate',
  
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          phase = history(),
          inMinus1 = history(),
          genName = 'gen.' + this.name,
          filter = void 0,
          sum = void 0,
          out = void 0;
  
      _gen.closures.add(_defineProperty({}, this.name, this));
  
      out = ' var ' + this.name + '_diff = ' + inputs[0] + ' - ' + genName + '.lastSample\n  if( ' + this.name + '_diff < -.5 ) ' + this.name + '_diff += 1\n  ' + genName + '.phase += ' + this.name + '_diff * ' + inputs[1] + '\n  if( ' + genName + '.phase > 1 ) ' + genName + '.phase -= 1\n  ' + genName + '.lastSample = ' + inputs[0] + '\n';
      out = ' ' + out;
  
      return [genName + '.phase', out];
    }
  };
  
  module.exports = function (in1, rate) {
    var ugen = Object.create(proto);
  
    Object.assign(ugen, {
      phase: 0,
      lastSample: 0,
      uid: _gen.getUID(),
      inputs: [in1, rate]
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./add.js":5,"./delta.js":22,"./gen.js":32,"./history.js":36,"./memo.js":44,"./mul.js":50,"./sub.js":69,"./wrap.js":77}],62:[function(require,module,exports){
  'use strict';
  
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'round',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add(_defineProperty({}, this.name, isWorklet ? 'Math.round' : Math.round));
  
        out = ref + 'round( ' + inputs[0] + ' )';
      } else {
        out = Math.round(parseFloat(inputs[0]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var round = Object.create(proto);
  
    round.inputs = [x];
  
    return round;
  };
  
  },{"./gen.js":32}],63:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'sah',
  
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          out = void 0;
  
      //gen.data[ this.name ] = 0
      //gen.data[ this.name + '_control' ] = 0
  
      _gen.requestMemory(this.memory);
  
      out = ' var ' + this.name + '_control = memory[' + this.memory.control.idx + '],\n      ' + this.name + '_trigger = ' + inputs[1] + ' > ' + inputs[2] + ' ? 1 : 0\n\n  if( ' + this.name + '_trigger !== ' + this.name + '_control  ) {\n    if( ' + this.name + '_trigger === 1 ) \n      memory[' + this.memory.value.idx + '] = ' + inputs[0] + '\n    \n    memory[' + this.memory.control.idx + '] = ' + this.name + '_trigger\n  }\n';
  
      _gen.memo[this.name] = 'memory[' + this.memory.value.idx + ']'; //`gen.data.${this.name}`
  
      return ['memory[' + this.memory.value.idx + ']', ' ' + out];
    }
  };
  
  module.exports = function (in1, control) {
    var threshold = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var properties = arguments[3];
  
    var ugen = Object.create(proto),
        defaults = { init: 0 };
  
    if (properties !== undefined) Object.assign(defaults, properties);
  
    Object.assign(ugen, {
      lastSample: 0,
      uid: _gen.getUID(),
      inputs: [in1, control, threshold],
      memory: {
        control: { idx: null, length: 1 },
        value: { idx: null, length: 1 }
      }
    }, defaults);
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./gen.js":32}],64:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'selector',
  
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          out = void 0,
          returnValue = 0;
  
      switch (inputs.length) {
        case 2:
          returnValue = inputs[1];
          break;
        case 3:
          out = '  var ' + this.name + '_out = ' + inputs[0] + ' === 1 ? ' + inputs[1] + ' : ' + inputs[2] + '\n\n';
          returnValue = [this.name + '_out', out];
          break;
        default:
          out = ' var ' + this.name + '_out = 0\n  switch( ' + inputs[0] + ' + 1 ) {\n';
  
          for (var i = 1; i < inputs.length; i++) {
            out += '    case ' + i + ': ' + this.name + '_out = ' + inputs[i] + '; break;\n';
          }
  
          out += '  }\n\n';
  
          returnValue = [this.name + '_out', ' ' + out];
      }
  
      _gen.memo[this.name] = this.name + '_out';
  
      return returnValue;
    }
  };
  
  module.exports = function () {
    for (var _len = arguments.length, inputs = Array(_len), _key = 0; _key < _len; _key++) {
      inputs[_key] = arguments[_key];
    }
  
    var ugen = Object.create(proto);
  
    Object.assign(ugen, {
      uid: _gen.getUID(),
      inputs: inputs
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./gen.js":32}],65:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      accum = require('./accum.js'),
      counter = require('./counter.js'),
      peek = require('./peek.js'),
      ssd = require('./history.js'),
      data = require('./data.js'),
      proto = { basename: 'seq' };
  
  module.exports = function () {
    var durations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 11025;
    var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [0, 1];
    var phaseIncrement = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  
    var clock = void 0;
  
    if (Array.isArray(durations)) {
      // we want a counter that is using our current
      // rate value, but we want the rate value to be derived from
      // the counter. must insert a single-sample dealy to avoid
      // infinite loop.
      var clock2 = counter(0, 0, durations.length);
      var __durations = peek(data(durations), clock2, { mode: 'simple' });
      clock = counter(phaseIncrement, 0, __durations);
  
      // add one sample delay to avoid codegen loop
      var s = ssd();
      s.in(clock.wrap);
      clock2.inputs[0] = s.out;
    } else {
      // if the rate argument is a single value we don't need to
      // do anything tricky.
      clock = counter(phaseIncrement, 0, durations);
    }
  
    var stepper = accum(clock.wrap, 0, { min: 0, max: values.length });
  
    var ugen = peek(data(values), stepper, { mode: 'simple' });
  
    ugen.name = proto.basename + gen.getUID();
    ugen.trigger = clock.wrap;
  
    return ugen;
  };
  
  },{"./accum.js":2,"./counter.js":16,"./data.js":18,"./gen.js":32,"./history.js":36,"./peek.js":56}],66:[function(require,module,exports){
  'use strict';
  
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  var _gen = require('./gen.js');
  
  var proto = {
    name: 'sign',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add(_defineProperty({}, this.name, isWorklet ? 'Math.sign' : Math.sign));
  
        out = ref + 'sign( ' + inputs[0] + ' )';
      } else {
        out = Math.sign(parseFloat(inputs[0]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var sign = Object.create(proto);
  
    sign.inputs = [x];
  
    return sign;
  };
  
  },{"./gen.js":32}],67:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'sin',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add({ 'sin': isWorklet ? 'Math.sin' : Math.sin });
  
        out = ref + 'sin( ' + inputs[0] + ' )';
      } else {
        out = Math.sin(parseFloat(inputs[0]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var sin = Object.create(proto);
  
    sin.inputs = [x];
    sin.id = _gen.getUID();
    sin.name = sin.basename + '{sin.id}';
  
    return sin;
  };
  
  },{"./gen.js":32}],68:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      history = require('./history.js'),
      sub = require('./sub.js'),
      add = require('./add.js'),
      mul = require('./mul.js'),
      memo = require('./memo.js'),
      gt = require('./gt.js'),
      div = require('./div.js'),
      _switch = require('./switch.js');
  
  module.exports = function (in1) {
      var slideUp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      var slideDown = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  
      var y1 = history(0),
          filter = void 0,
          slideAmount = void 0;
  
      //y (n) = y (n-1) + ((x (n) - y (n-1))/slide) 
      slideAmount = _switch(gt(in1, y1.out), slideUp, slideDown);
  
      filter = memo(add(y1.out, div(sub(in1, y1.out), slideAmount)));
  
      y1.in(filter);
  
      return filter;
  };
  
  },{"./add.js":5,"./div.js":23,"./gen.js":32,"./gt.js":33,"./history.js":36,"./memo.js":44,"./mul.js":50,"./sub.js":69,"./switch.js":70}],69:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'sub',
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          out = 0,
          diff = 0,
          needsParens = false,
          numCount = 0,
          lastNumber = inputs[0],
          lastNumberIsUgen = isNaN(lastNumber),
          subAtEnd = false,
          hasUgens = false,
          returnValue = 0;
  
      this.inputs.forEach(function (value) {
        if (isNaN(value)) hasUgens = true;
      });
  
      out = '  var ' + this.name + ' = ';
  
      inputs.forEach(function (v, i) {
        if (i === 0) return;
  
        var isNumberUgen = isNaN(v),
            isFinalIdx = i === inputs.length - 1;
  
        if (!lastNumberIsUgen && !isNumberUgen) {
          lastNumber = lastNumber - v;
          out += lastNumber;
          return;
        } else {
          needsParens = true;
          out += lastNumber + ' - ' + v;
        }
  
        if (!isFinalIdx) out += ' - ';
      });
  
      out += '\n';
  
      returnValue = [this.name, out];
  
      _gen.memo[this.name] = this.name;
  
      return returnValue;
    }
  };
  
  module.exports = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
  
    var sub = Object.create(proto);
  
    Object.assign(sub, {
      id: _gen.getUID(),
      inputs: args
    });
  
    sub.name = 'sub' + sub.id;
  
    return sub;
  };
  
  },{"./gen.js":32}],70:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'switch',
  
    gen: function gen() {
      var inputs = _gen.getInputs(this),
          out = void 0;
  
      if (inputs[1] === inputs[2]) return inputs[1]; // if both potential outputs are the same just return one of them
  
      out = '  var ' + this.name + '_out = ' + inputs[0] + ' === 1 ? ' + inputs[1] + ' : ' + inputs[2] + '\n';
  
      _gen.memo[this.name] = this.name + '_out';
  
      return [this.name + '_out', out];
    }
  };
  
  module.exports = function (control) {
    var in1 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    var in2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  
    var ugen = Object.create(proto);
    Object.assign(ugen, {
      uid: _gen.getUID(),
      inputs: [control, in1, in2]
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./gen.js":32}],71:[function(require,module,exports){
  'use strict';
  
  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 't60',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this),
          returnValue = void 0;
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add(_defineProperty({}, 'exp', isWorklet ? 'Math.exp' : Math.exp));
  
        out = '  var ' + this.name + ' = ' + ref + 'exp( -6.907755278921 / ' + inputs[0] + ' )\n\n';
  
        _gen.memo[this.name] = out;
  
        returnValue = [this.name, out];
      } else {
        out = Math.exp(-6.907755278921 / inputs[0]);
  
        returnValue = out;
      }
  
      return returnValue;
    }
  };
  
  module.exports = function (x) {
    var t60 = Object.create(proto);
  
    t60.inputs = [x];
    t60.name = proto.basename + _gen.getUID();
  
    return t60;
  };
  
  },{"./gen.js":32}],72:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'tan',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add({ 'tan': isWorklet ? 'Math.tan' : Math.tan });
  
        out = ref + 'tan( ' + inputs[0] + ' )';
      } else {
        out = Math.tan(parseFloat(inputs[0]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var tan = Object.create(proto);
  
    tan.inputs = [x];
    tan.id = _gen.getUID();
    tan.name = tan.basename + '{tan.id}';
  
    return tan;
  };
  
  },{"./gen.js":32}],73:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js');
  
  var proto = {
    basename: 'tanh',
  
    gen: function gen() {
      var out = void 0,
          inputs = _gen.getInputs(this);
  
      var isWorklet = _gen.mode === 'worklet';
      var ref = isWorklet ? '' : 'gen.';
  
      if (isNaN(inputs[0])) {
        _gen.closures.add({ 'tanh': isWorklet ? 'Math.tan' : Math.tanh });
  
        out = ref + 'tanh( ' + inputs[0] + ' )';
      } else {
        out = Math.tanh(parseFloat(inputs[0]));
      }
  
      return out;
    }
  };
  
  module.exports = function (x) {
    var tanh = Object.create(proto);
  
    tanh.inputs = [x];
    tanh.id = _gen.getUID();
    tanh.name = tanh.basename + '{tanh.id}';
  
    return tanh;
  };
  
  },{"./gen.js":32}],74:[function(require,module,exports){
  'use strict';
  
  var gen = require('./gen.js'),
      lt = require('./lt.js'),
      accum = require('./accum.js'),
      div = require('./div.js');
  
  module.exports = function () {
    var frequency = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 440;
    var pulsewidth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : .5;
  
    var graph = lt(accum(div(frequency, 44100)), pulsewidth);
  
    graph.name = 'train' + gen.getUID();
  
    return graph;
  };
  
  },{"./accum.js":2,"./div.js":23,"./gen.js":32,"./lt.js":40}],75:[function(require,module,exports){
  'use strict';
  
  var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();
  
  var AWPF = require('./external/audioworklet-polyfill.js'),
      gen = require('./gen.js'),
      data = require('./data.js');
  
  var isStereo = false;
  
  var utilities = {
    ctx: null,
    buffers: {},
    isStereo: false,
  
    clear: function clear() {
      if (this.workletNode !== undefined) {
        this.workletNode.disconnect();
      } else {
        this.callback = function () {
          return 0;
        };
      }
      this.clear.callbacks.forEach(function (v) {
        return v();
      });
      this.clear.callbacks.length = 0;
  
      this.isStereo = false;
  
      if (gen.graph !== null) gen.free(gen.graph);
    },
    createContext: function createContext() {
      var _this = this;
  
      var bufferSize = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2048;
  
      var AC = typeof AudioContext === 'undefined' ? webkitAudioContext : AudioContext;
  
      // tell polyfill global object and buffersize
      AWPF(window, bufferSize);
  
      var start = function start() {
        if (typeof AC !== 'undefined') {
          _this.ctx = new AC({ latencyHint: .0125 });
  
          gen.samplerate = _this.ctx.sampleRate;
  
          if (document && document.documentElement && 'ontouchstart' in document.documentElement) {
            window.removeEventListener('touchstart', start);
          } else {
            window.removeEventListener('mousedown', start);
            window.removeEventListener('keydown', start);
          }
  
          var mySource = utilities.ctx.createBufferSource();
          mySource.connect(utilities.ctx.destination);
          mySource.start();
        }
      };
  
      if (document && document.documentElement && 'ontouchstart' in document.documentElement) {
        window.addEventListener('touchstart', start);
      } else {
        window.addEventListener('mousedown', start);
        window.addEventListener('keydown', start);
      }
  
      return this;
    },
    createScriptProcessor: function createScriptProcessor() {
      this.node = this.ctx.createScriptProcessor(1024, 0, 2);
      this.clearFunction = function () {
        return 0;
      };
      if (typeof this.callback === 'undefined') this.callback = this.clearFunction;
  
      this.node.onaudioprocess = function (audioProcessingEvent) {
        var outputBuffer = audioProcessingEvent.outputBuffer;
  
        var left = outputBuffer.getChannelData(0),
            right = outputBuffer.getChannelData(1),
            isStereo = utilities.isStereo;
  
        for (var sample = 0; sample < left.length; sample++) {
          var out = utilities.callback();
  
          if (isStereo === false) {
            left[sample] = right[sample] = out;
          } else {
            left[sample] = out[0];
            right[sample] = out[1];
          }
        }
      };
  
      this.node.connect(this.ctx.destination);
  
      return this;
    },
  
  
    // remove starting stuff and add tabs
    prettyPrintCallback: function prettyPrintCallback(cb) {
      // get rid of "function gen" and start with parenthesis
      // const shortendCB = cb.toString().slice(9)
      var cbSplit = cb.toString().split('\n');
      var cbTrim = cbSplit.slice(3, -2);
      var cbTabbed = cbTrim.map(function (v) {
        return '      ' + v;
      });
  
      return cbTabbed.join('\n');
    },
    createParameterDescriptors: function createParameterDescriptors(cb) {
      // [{name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1}];
      var paramStr = '';
  
      //for( let ugen of cb.params.values() ) {
      //  paramStr += `{ name:'${ugen.name}', defaultValue:${ugen.value}, minValue:${ugen.min}, maxValue:${ugen.max} },\n      `
      //}
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;
  
      try {
        for (var _iterator = cb.params.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var ugen = _step.value;
  
          paramStr += '{ name:\'' + ugen.name + '\', automationRate:\'k-rate\', defaultValue:' + ugen.defaultValue + ', minValue:' + ugen.min + ', maxValue:' + ugen.max + ' },\n      ';
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
  
      return paramStr;
    },
    createParameterDereferences: function createParameterDereferences(cb) {
      var str = cb.params.size > 0 ? '\n      ' : '';
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;
  
      try {
        for (var _iterator2 = cb.params.values()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var ugen = _step2.value;
  
          str += 'const ' + ugen.name + ' = parameters.' + ugen.name + '[0]\n      ';
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
  
      return str;
    },
    createParameterArguments: function createParameterArguments(cb) {
      var paramList = '';
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;
  
      try {
        for (var _iterator3 = cb.params.values()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var ugen = _step3.value;
  
          paramList += ugen.name + '[i],';
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
  
      paramList = paramList.slice(0, -1);
  
      return paramList;
    },
    createInputDereferences: function createInputDereferences(cb) {
      var str = cb.inputs.size > 0 ? '\n' : '';
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;
  
      try {
        for (var _iterator4 = cb.inputs.values()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var input = _step4.value;
  
          str += 'const ' + input.name + ' = inputs[ ' + input.inputNumber + ' ][ ' + input.channelNumber + ' ]\n      ';
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
  
      return str;
    },
    createInputArguments: function createInputArguments(cb) {
      var paramList = '';
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;
  
      try {
        for (var _iterator5 = cb.inputs.values()[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var input = _step5.value;
  
          paramList += input.name + '[i],';
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
  
      paramList = paramList.slice(0, -1);
  
      return paramList;
    },
    createFunctionDereferences: function createFunctionDereferences(cb) {
      var memberString = cb.members.size > 0 ? '\n' : '';
      var memo = {};
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;
  
      try {
        for (var _iterator6 = cb.members.values()[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var dict = _step6.value;
  
          var name = Object.keys(dict)[0],
              value = dict[name];
  
          if (memo[name] !== undefined) continue;
          memo[name] = true;
  
          memberString += '      const ' + name + ' = ' + value + '\n';
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }
  
      return memberString;
    },
    createWorkletProcessor: function createWorkletProcessor(graph, name, debug) {
      var mem = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 44100 * 10;
  
      //const mem = MemoryHelper.create( 4096, Float64Array )
      var cb = gen.createCallback(graph, mem, debug);
      var inputs = cb.inputs;
  
      // get all inputs and create appropriate audioparam initializers
      var parameterDescriptors = this.createParameterDescriptors(cb);
      var parameterDereferences = this.createParameterDereferences(cb);
      var paramList = this.createParameterArguments(cb);
      var inputDereferences = this.createInputDereferences(cb);
      var inputList = this.createInputArguments(cb);
      var memberString = this.createFunctionDereferences(cb);
  
      // change output based on number of channels.
      var genishOutputLine = cb.isStereo === false ? 'left[ i ] = memory[0]' : 'left[ i ] = memory[0];\n\t\tright[ i ] = memory[1]\n';
  
      var prettyCallback = this.prettyPrintCallback(cb);
  
      /***** begin callback code ****/
      // note that we have to check to see that memory has been passed
      // to the worker before running the callback function, otherwise
      // it can be passed too slowly and fail on occassion
  
      var workletCode = '\nclass ' + name + 'Processor extends AudioWorkletProcessor {\n\n  static get parameterDescriptors() {\n    const params = [\n      ' + parameterDescriptors + '      \n    ]\n    return params\n  }\n \n  constructor( options ) {\n    super( options )\n    this.port.onmessage = this.handleMessage.bind( this )\n    this.initialized = false\n  }\n\n  handleMessage( event ) {\n    if( event.data.key === \'init\' ) {\n      this.memory = event.data.memory\n      this.initialized = true\n    }else if( event.data.key === \'set\' ) {\n      this.memory[ event.data.idx ] = event.data.value\n    }else if( event.data.key === \'get\' ) {\n      this.port.postMessage({ key:\'return\', idx:event.data.idx, value:this.memory[event.data.idx] })     \n    }\n  }\n\n  process( inputs, outputs, parameters ) {\n    if( this.initialized === true ) {\n      const output = outputs[0]\n      const left   = output[ 0 ]\n      const right  = output[ 1 ]\n      const len    = left.length\n      const memory = this.memory ' + parameterDereferences + inputDereferences + memberString + '\n\n      for( let i = 0; i < len; ++i ) {\n        ' + prettyCallback + '\n        ' + genishOutputLine + '\n      }\n    }\n    return true\n  }\n}\n    \nregisterProcessor( \'' + name + '\', ' + name + 'Processor)';
  
      /***** end callback code *****/
  
      if (debug === true) console.log(workletCode);
  
      var url = window.URL.createObjectURL(new Blob([workletCode], { type: 'text/javascript' }));
  
      return [url, workletCode, inputs, cb.params, cb.isStereo];
    },
  
  
    registeredForNodeAssignment: [],
    register: function register(ugen) {
      if (this.registeredForNodeAssignment.indexOf(ugen) === -1) {
        this.registeredForNodeAssignment.push(ugen);
      }
    },
    playWorklet: function playWorklet(graph, name) {
      var debug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var mem = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 44100 * 60;
  
      utilities.clear();
  
      var _utilities$createWork = utilities.createWorkletProcessor(graph, name, debug, mem),
          _utilities$createWork2 = _slicedToArray(_utilities$createWork, 5),
          url = _utilities$createWork2[0],
          codeString = _utilities$createWork2[1],
          inputs = _utilities$createWork2[2],
          params = _utilities$createWork2[3],
          isStereo = _utilities$createWork2[4];
  
      var nodePromise = new Promise(function (resolve, reject) {
  
        utilities.ctx.audioWorklet.addModule(url).then(function () {
          var workletNode = new AudioWorkletNode(utilities.ctx, name, { outputChannelCount: [isStereo ? 2 : 1] });
  
          workletNode.callbacks = {};
          workletNode.onmessage = function (event) {
            if (event.data.message === 'return') {
              workletNode.callbacks[event.data.idx](event.data.value);
              delete workletNode.callbacks[event.data.idx];
            }
          };
  
          workletNode.getMemoryValue = function (idx, cb) {
            this.workletCallbacks[idx] = cb;
            this.workletNode.port.postMessage({ key: 'get', idx: idx });
          };
  
          workletNode.port.postMessage({ key: 'init', memory: gen.memory.heap });
          utilities.workletNode = workletNode;
  
          utilities.registeredForNodeAssignment.forEach(function (ugen) {
            return ugen.node = workletNode;
          });
          utilities.registeredForNodeAssignment.length = 0;
  
          // assign all params as properties of node for easier reference 
          var _iteratorNormalCompletion7 = true;
          var _didIteratorError7 = false;
          var _iteratorError7 = undefined;
  
          try {
            var _loop = function _loop() {
              var dict = _step7.value;
  
              var name = Object.keys(dict)[0];
              var param = workletNode.parameters.get(name);
  
              Object.defineProperty(workletNode, name, {
                set: function set(v) {
                  param.value = v;
                },
                get: function get() {
                  return param.value;
                }
              });
            };
  
            for (var _iterator7 = inputs.values()[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
              _loop();
            }
          } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion7 && _iterator7.return) {
                _iterator7.return();
              }
            } finally {
              if (_didIteratorError7) {
                throw _iteratorError7;
              }
            }
          }
  
          var _iteratorNormalCompletion8 = true;
          var _didIteratorError8 = false;
          var _iteratorError8 = undefined;
  
          try {
            var _loop2 = function _loop2() {
              var ugen = _step8.value;
  
              var name = ugen.name;
              var param = workletNode.parameters.get(name);
              ugen.waapi = param;
              // initialize?
              param.value = ugen.defaultValue;
  
              Object.defineProperty(workletNode, name, {
                set: function set(v) {
                  param.value = v;
                },
                get: function get() {
                  return param.value;
                }
              });
            };
  
            for (var _iterator8 = params.values()[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
              _loop2();
            }
          } catch (err) {
            _didIteratorError8 = true;
            _iteratorError8 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion8 && _iterator8.return) {
                _iterator8.return();
              }
            } finally {
              if (_didIteratorError8) {
                throw _iteratorError8;
              }
            }
          }
  
          if (utilities.console) utilities.console.setValue(codeString);
  
          workletNode.connect(utilities.ctx.destination);
  
          resolve(workletNode);
        });
      });
  
      return nodePromise;
    },
    playGraph: function playGraph(graph, debug) {
      var mem = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 44100 * 10;
      var memType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : Float32Array;
  
      utilities.clear();
      if (debug === undefined) debug = false;
  
      this.isStereo = Array.isArray(graph);
  
      utilities.callback = gen.createCallback(graph, mem, debug, false, memType);
  
      if (utilities.console) utilities.console.setValue(utilities.callback.toString());
  
      return utilities.callback;
    },
    loadSample: function loadSample(soundFilePath, data) {
      var isLoaded = utilities.buffers[soundFilePath] !== undefined;
  
      var req = new XMLHttpRequest();
      req.open('GET', soundFilePath, true);
      req.responseType = 'arraybuffer';
  
      var promise = new Promise(function (resolve, reject) {
        if (!isLoaded) {
          req.onload = function () {
            var audioData = req.response;
  
            utilities.ctx.decodeAudioData(audioData, function (buffer) {
              data.buffer = buffer.getChannelData(0);
              utilities.buffers[soundFilePath] = data.buffer;
              resolve(data.buffer);
            });
          };
        } else {
          setTimeout(function () {
            return resolve(utilities.buffers[soundFilePath]);
          }, 0);
        }
      });
  
      if (!isLoaded) req.send();
  
      return promise;
    }
  };
  
  utilities.clear.callbacks = [];
  
  module.exports = utilities;
  
  },{"./data.js":18,"./external/audioworklet-polyfill.js":27,"./gen.js":32}],76:[function(require,module,exports){
  'use strict';
  
  /*
   * many windows here adapted from https://github.com/corbanbrook/dsp.js/blob/master/dsp.js
   * starting at line 1427
   * taken 8/15/16
  */
  
  var windows = module.exports = {
    bartlett: function bartlett(length, index) {
      return 2 / (length - 1) * ((length - 1) / 2 - Math.abs(index - (length - 1) / 2));
    },
    bartlettHann: function bartlettHann(length, index) {
      return 0.62 - 0.48 * Math.abs(index / (length - 1) - 0.5) - 0.38 * Math.cos(2 * Math.PI * index / (length - 1));
    },
    blackman: function blackman(length, index, alpha) {
      var a0 = (1 - alpha) / 2,
          a1 = 0.5,
          a2 = alpha / 2;
  
      return a0 - a1 * Math.cos(2 * Math.PI * index / (length - 1)) + a2 * Math.cos(4 * Math.PI * index / (length - 1));
    },
    cosine: function cosine(length, index) {
      return Math.cos(Math.PI * index / (length - 1) - Math.PI / 2);
    },
    gauss: function gauss(length, index, alpha) {
      return Math.pow(Math.E, -0.5 * Math.pow((index - (length - 1) / 2) / (alpha * (length - 1) / 2), 2));
    },
    hamming: function hamming(length, index) {
      return 0.54 - 0.46 * Math.cos(Math.PI * 2 * index / (length - 1));
    },
    hann: function hann(length, index) {
      return 0.5 * (1 - Math.cos(Math.PI * 2 * index / (length - 1)));
    },
    lanczos: function lanczos(length, index) {
      var x = 2 * index / (length - 1) - 1;
      return Math.sin(Math.PI * x) / (Math.PI * x);
    },
    rectangular: function rectangular(length, index) {
      return 1;
    },
    triangular: function triangular(length, index) {
      return 2 / length * (length / 2 - Math.abs(index - (length - 1) / 2));
    },
  
  
    // parabola
    welch: function welch(length, _index, ignore) {
      var shift = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  
      //w[n] = 1 - Math.pow( ( n - ( (N-1) / 2 ) ) / (( N-1 ) / 2 ), 2 )
      var index = shift === 0 ? _index : (_index + Math.floor(shift * length)) % length;
      var n_1_over2 = (length - 1) / 2;
  
      return 1 - Math.pow((index - n_1_over2) / n_1_over2, 2);
    },
    inversewelch: function inversewelch(length, _index, ignore) {
      var shift = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  
      //w[n] = 1 - Math.pow( ( n - ( (N-1) / 2 ) ) / (( N-1 ) / 2 ), 2 )
      var index = shift === 0 ? _index : (_index + Math.floor(shift * length)) % length;
      var n_1_over2 = (length - 1) / 2;
  
      return Math.pow((index - n_1_over2) / n_1_over2, 2);
    },
    parabola: function parabola(length, index) {
      if (index <= length / 2) {
        return windows.inversewelch(length / 2, index) - 1;
      } else {
        return 1 - windows.inversewelch(length / 2, index - length / 2);
      }
    },
    exponential: function exponential(length, index, alpha) {
      return Math.pow(index / length, alpha);
    },
    linear: function linear(length, index) {
      return index / length;
    }
  };
  
  },{}],77:[function(require,module,exports){
  'use strict';
  
  var _gen = require('./gen.js'),
      floor = require('./floor.js'),
      sub = require('./sub.js'),
      memo = require('./memo.js');
  
  var proto = {
    basename: 'wrap',
  
    gen: function gen() {
      var code = void 0,
          inputs = _gen.getInputs(this),
          signal = inputs[0],
          min = inputs[1],
          max = inputs[2],
          out = void 0,
          diff = void 0;
  
      //out = `(((${inputs[0]} - ${this.min}) % ${diff}  + ${diff}) % ${diff} + ${this.min})`
      //const long numWraps = long((v-lo)/range) - (v < lo);
      //return v - range * double(numWraps);   
  
      if (this.min === 0) {
        diff = max;
      } else if (isNaN(max) || isNaN(min)) {
        diff = max + ' - ' + min;
      } else {
        diff = max - min;
      }
  
      out = ' var ' + this.name + ' = ' + inputs[0] + '\n  if( ' + this.name + ' < ' + this.min + ' ) ' + this.name + ' += ' + diff + '\n  else if( ' + this.name + ' > ' + this.max + ' ) ' + this.name + ' -= ' + diff + '\n\n';
  
      return [this.name, ' ' + out];
    }
  };
  
  module.exports = function (in1) {
    var min = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var max = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  
    var ugen = Object.create(proto);
  
    Object.assign(ugen, {
      min: min,
      max: max,
      uid: _gen.getUID(),
      inputs: [in1, min, max]
    });
  
    ugen.name = '' + ugen.basename + ugen.uid;
  
    return ugen;
  };
  
  },{"./floor.js":29,"./gen.js":32,"./memo.js":44,"./sub.js":69}],78:[function(require,module,exports){
  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.
  
  var objectCreate = Object.create || objectCreatePolyfill
  var objectKeys = Object.keys || objectKeysPolyfill
  var bind = Function.prototype.bind || functionBindPolyfill
  
  function EventEmitter() {
    if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
      this._events = objectCreate(null);
      this._eventsCount = 0;
    }
  
    this._maxListeners = this._maxListeners || undefined;
  }
  module.exports = EventEmitter;
  
  // Backwards-compat with node 0.10.x
  EventEmitter.EventEmitter = EventEmitter;
  
  EventEmitter.prototype._events = undefined;
  EventEmitter.prototype._maxListeners = undefined;
  
  // By default EventEmitters will print a warning if more than 10 listeners are
  // added to it. This is a useful default which helps finding memory leaks.
  var defaultMaxListeners = 10;
  
  var hasDefineProperty;
  try {
    var o = {};
    if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
    hasDefineProperty = o.x === 0;
  } catch (err) { hasDefineProperty = false }
  if (hasDefineProperty) {
    Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
      enumerable: true,
      get: function() {
        return defaultMaxListeners;
      },
      set: function(arg) {
        // check whether the input is a positive number (whose value is zero or
        // greater and not a NaN).
        if (typeof arg !== 'number' || arg < 0 || arg !== arg)
          throw new TypeError('"defaultMaxListeners" must be a positive number');
        defaultMaxListeners = arg;
      }
    });
  } else {
    EventEmitter.defaultMaxListeners = defaultMaxListeners;
  }
  
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.
  EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || isNaN(n))
      throw new TypeError('"n" argument must be a positive number');
    this._maxListeners = n;
    return this;
  };
  
  function $getMaxListeners(that) {
    if (that._maxListeners === undefined)
      return EventEmitter.defaultMaxListeners;
    return that._maxListeners;
  }
  
  EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return $getMaxListeners(this);
  };
  
  // These standalone emit* functions are used to optimize calling of event
  // handlers for fast cases because emit() itself often has a variable number of
  // arguments and can be deoptimized because of that. These functions always have
  // the same number of arguments and thus do not get deoptimized, so the code
  // inside them can execute faster.
  function emitNone(handler, isFn, self) {
    if (isFn)
      handler.call(self);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self);
    }
  }
  function emitOne(handler, isFn, self, arg1) {
    if (isFn)
      handler.call(self, arg1);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self, arg1);
    }
  }
  function emitTwo(handler, isFn, self, arg1, arg2) {
    if (isFn)
      handler.call(self, arg1, arg2);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self, arg1, arg2);
    }
  }
  function emitThree(handler, isFn, self, arg1, arg2, arg3) {
    if (isFn)
      handler.call(self, arg1, arg2, arg3);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].call(self, arg1, arg2, arg3);
    }
  }
  
  function emitMany(handler, isFn, self, args) {
    if (isFn)
      handler.apply(self, args);
    else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        listeners[i].apply(self, args);
    }
  }
  
  EventEmitter.prototype.emit = function emit(type) {
    var er, handler, len, args, i, events;
    var doError = (type === 'error');
  
    events = this._events;
    if (events)
      doError = (doError && events.error == null);
    else if (!doError)
      return false;
  
    // If there is no 'error' event listener then throw.
    if (doError) {
      if (arguments.length > 1)
        er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Unhandled "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
      return false;
    }
  
    handler = events[type];
  
    if (!handler)
      return false;
  
    var isFn = typeof handler === 'function';
    len = arguments.length;
    switch (len) {
        // fast cases
      case 1:
        emitNone(handler, isFn, this);
        break;
      case 2:
        emitOne(handler, isFn, this, arguments[1]);
        break;
      case 3:
        emitTwo(handler, isFn, this, arguments[1], arguments[2]);
        break;
      case 4:
        emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
        break;
        // slower
      default:
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        emitMany(handler, isFn, this, args);
    }
  
    return true;
  };
  
  function _addListener(target, type, listener, prepend) {
    var m;
    var events;
    var existing;
  
    if (typeof listener !== 'function')
      throw new TypeError('"listener" argument must be a function');
  
    events = target._events;
    if (!events) {
      events = target._events = objectCreate(null);
      target._eventsCount = 0;
    } else {
      // To avoid recursion in the case that type === "newListener"! Before
      // adding it to the listeners, first emit "newListener".
      if (events.newListener) {
        target.emit('newListener', type,
            listener.listener ? listener.listener : listener);
  
        // Re-assign `events` because a newListener handler could have caused the
        // this._events to be assigned to a new object
        events = target._events;
      }
      existing = events[type];
    }
  
    if (!existing) {
      // Optimize the case of one listener. Don't need the extra array object.
      existing = events[type] = listener;
      ++target._eventsCount;
    } else {
      if (typeof existing === 'function') {
        // Adding the second element, need to change to array.
        existing = events[type] =
            prepend ? [listener, existing] : [existing, listener];
      } else {
        // If we've already got an array, just append.
        if (prepend) {
          existing.unshift(listener);
        } else {
          existing.push(listener);
        }
      }
  
      // Check for listener leak
      if (!existing.warned) {
        m = $getMaxListeners(target);
        if (m && m > 0 && existing.length > m) {
          existing.warned = true;
          var w = new Error('Possible EventEmitter memory leak detected. ' +
              existing.length + ' "' + String(type) + '" listeners ' +
              'added. Use emitter.setMaxListeners() to ' +
              'increase limit.');
          w.name = 'MaxListenersExceededWarning';
          w.emitter = target;
          w.type = type;
          w.count = existing.length;
          if (typeof console === 'object' && console.warn) {
            console.warn('%s: %s', w.name, w.message);
          }
        }
      }
    }
  
    return target;
  }
  
  EventEmitter.prototype.addListener = function addListener(type, listener) {
    return _addListener(this, type, listener, false);
  };
  
  EventEmitter.prototype.on = EventEmitter.prototype.addListener;
  
  EventEmitter.prototype.prependListener =
      function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };
  
  function onceWrapper() {
    if (!this.fired) {
      this.target.removeListener(this.type, this.wrapFn);
      this.fired = true;
      switch (arguments.length) {
        case 0:
          return this.listener.call(this.target);
        case 1:
          return this.listener.call(this.target, arguments[0]);
        case 2:
          return this.listener.call(this.target, arguments[0], arguments[1]);
        case 3:
          return this.listener.call(this.target, arguments[0], arguments[1],
              arguments[2]);
        default:
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; ++i)
            args[i] = arguments[i];
          this.listener.apply(this.target, args);
      }
    }
  }
  
  function _onceWrap(target, type, listener) {
    var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
    var wrapped = bind.call(onceWrapper, state);
    wrapped.listener = listener;
    state.wrapFn = wrapped;
    return wrapped;
  }
  
  EventEmitter.prototype.once = function once(type, listener) {
    if (typeof listener !== 'function')
      throw new TypeError('"listener" argument must be a function');
    this.on(type, _onceWrap(this, type, listener));
    return this;
  };
  
  EventEmitter.prototype.prependOnceListener =
      function prependOnceListener(type, listener) {
        if (typeof listener !== 'function')
          throw new TypeError('"listener" argument must be a function');
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };
  
  // Emits a 'removeListener' event if and only if the listener was removed.
  EventEmitter.prototype.removeListener =
      function removeListener(type, listener) {
        var list, events, position, i, originalListener;
  
        if (typeof listener !== 'function')
          throw new TypeError('"listener" argument must be a function');
  
        events = this._events;
        if (!events)
          return this;
  
        list = events[type];
        if (!list)
          return this;
  
        if (list === listener || list.listener === listener) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else {
            delete events[type];
            if (events.removeListener)
              this.emit('removeListener', type, list.listener || listener);
          }
        } else if (typeof list !== 'function') {
          position = -1;
  
          for (i = list.length - 1; i >= 0; i--) {
            if (list[i] === listener || list[i].listener === listener) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }
  
          if (position < 0)
            return this;
  
          if (position === 0)
            list.shift();
          else
            spliceOne(list, position);
  
          if (list.length === 1)
            events[type] = list[0];
  
          if (events.removeListener)
            this.emit('removeListener', type, originalListener || listener);
        }
  
        return this;
      };
  
  EventEmitter.prototype.removeAllListeners =
      function removeAllListeners(type) {
        var listeners, events, i;
  
        events = this._events;
        if (!events)
          return this;
  
        // not listening for removeListener, no need to emit
        if (!events.removeListener) {
          if (arguments.length === 0) {
            this._events = objectCreate(null);
            this._eventsCount = 0;
          } else if (events[type]) {
            if (--this._eventsCount === 0)
              this._events = objectCreate(null);
            else
              delete events[type];
          }
          return this;
        }
  
        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
          var keys = objectKeys(events);
          var key;
          for (i = 0; i < keys.length; ++i) {
            key = keys[i];
            if (key === 'removeListener') continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners('removeListener');
          this._events = objectCreate(null);
          this._eventsCount = 0;
          return this;
        }
  
        listeners = events[type];
  
        if (typeof listeners === 'function') {
          this.removeListener(type, listeners);
        } else if (listeners) {
          // LIFO order
          for (i = listeners.length - 1; i >= 0; i--) {
            this.removeListener(type, listeners[i]);
          }
        }
  
        return this;
      };
  
  function _listeners(target, type, unwrap) {
    var events = target._events;
  
    if (!events)
      return [];
  
    var evlistener = events[type];
    if (!evlistener)
      return [];
  
    if (typeof evlistener === 'function')
      return unwrap ? [evlistener.listener || evlistener] : [evlistener];
  
    return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
  }
  
  EventEmitter.prototype.listeners = function listeners(type) {
    return _listeners(this, type, true);
  };
  
  EventEmitter.prototype.rawListeners = function rawListeners(type) {
    return _listeners(this, type, false);
  };
  
  EventEmitter.listenerCount = function(emitter, type) {
    if (typeof emitter.listenerCount === 'function') {
      return emitter.listenerCount(type);
    } else {
      return listenerCount.call(emitter, type);
    }
  };
  
  EventEmitter.prototype.listenerCount = listenerCount;
  function listenerCount(type) {
    var events = this._events;
  
    if (events) {
      var evlistener = events[type];
  
      if (typeof evlistener === 'function') {
        return 1;
      } else if (evlistener) {
        return evlistener.length;
      }
    }
  
    return 0;
  }
  
  EventEmitter.prototype.eventNames = function eventNames() {
    return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
  };
  
  // About 1.5x faster than the two-arg version of Array#splice().
  function spliceOne(list, index) {
    for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
      list[i] = list[k];
    list.pop();
  }
  
  function arrayClone(arr, n) {
    var copy = new Array(n);
    for (var i = 0; i < n; ++i)
      copy[i] = arr[i];
    return copy;
  }
  
  function unwrapListeners(arr) {
    var ret = new Array(arr.length);
    for (var i = 0; i < ret.length; ++i) {
      ret[i] = arr[i].listener || arr[i];
    }
    return ret;
  }
  
  function objectCreatePolyfill(proto) {
    var F = function() {};
    F.prototype = proto;
    return new F;
  }
  function objectKeysPolyfill(obj) {
    var keys = [];
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
      keys.push(k);
    }
    return k;
  }
  function functionBindPolyfill(context) {
    var fn = this;
    return function () {
      return fn.apply(context, arguments);
    };
  }
  
  },{}],79:[function(require,module,exports){
  'use strict';
  
  var MemoryHelper = {
    create: function create() {
      var size = arguments.length <= 0 || arguments[0] === undefined ? 4096 : arguments[0];
      var memtype = arguments.length <= 1 || arguments[1] === undefined ? Float32Array : arguments[1];
  
      var helper = Object.create(this);
  
      Object.assign(helper, {
        heap: new memtype(size),
        list: {},
        freeList: {}
      });
  
      return helper;
    },
    alloc: function alloc(amount) {
      var idx = -1;
  
      if (amount > this.heap.length) {
        throw Error('Allocation request is larger than heap size of ' + this.heap.length);
      }
  
      for (var key in this.freeList) {
        var candidateSize = this.freeList[key];
  
        if (candidateSize >= amount) {
          idx = key;
  
          this.list[idx] = amount;
  
          if (candidateSize !== amount) {
            var newIndex = idx + amount,
                newFreeSize = void 0;
  
            for (var _key in this.list) {
              if (_key > newIndex) {
                newFreeSize = _key - newIndex;
                this.freeList[newIndex] = newFreeSize;
              }
            }
          }
          
          break;
        }
      }
      
      if( idx !== -1 ) delete this.freeList[ idx ]
  
      if (idx === -1) {
        var keys = Object.keys(this.list),
            lastIndex = void 0;
  
        if (keys.length) {
          // if not first allocation...
          lastIndex = parseInt(keys[keys.length - 1]);
  
          idx = lastIndex + this.list[lastIndex];
        } else {
          idx = 0;
        }
  
        this.list[idx] = amount;
      }
  
      if (idx + amount >= this.heap.length) {
        throw Error('No available blocks remain sufficient for allocation request.');
      }
      return idx;
    },
    free: function free(index) {
      if (typeof this.list[index] !== 'number') {
        throw Error('Calling free() on non-existing block.');
      }
  
      this.list[index] = 0;
  
      var size = 0;
      for (var key in this.list) {
        if (key > index) {
          size = key - index;
          break;
        }
      }
  
      this.freeList[index] = size;
    }
  };
  
  module.exports = MemoryHelper;
  
  },{}]},{},[39])(39)
  });
  
  //# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9hYnMuanMiLCJqcy9hY2N1bS5qcyIsImpzL2Fjb3MuanMiLCJqcy9hZC5qcyIsImpzL2FkZC5qcyIsImpzL2Fkc3IuanMiLCJqcy9hbmQuanMiLCJqcy9hc2luLmpzIiwianMvYXRhbi5qcyIsImpzL2F0dGFjay5qcyIsImpzL2JhbmcuanMiLCJqcy9ib29sLmpzIiwianMvY2VpbC5qcyIsImpzL2NsYW1wLmpzIiwianMvY29zLmpzIiwianMvY291bnRlci5qcyIsImpzL2N5Y2xlLmpzIiwianMvZGF0YS5qcyIsImpzL2RjYmxvY2suanMiLCJqcy9kZWNheS5qcyIsImpzL2RlbGF5LmpzIiwianMvZGVsdGEuanMiLCJqcy9kaXYuanMiLCJqcy9lbnYuanMiLCJqcy9lcS5qcyIsImpzL2V4cC5qcyIsImpzL2V4dGVybmFsL2F1ZGlvd29ya2xldC1wb2x5ZmlsbC5qcyIsImpzL2V4dGVybmFsL3JlYWxtLmpzIiwianMvZmxvb3IuanMiLCJqcy9mb2xkLmpzIiwianMvZ2F0ZS5qcyIsImpzL2dlbi5qcyIsImpzL2d0LmpzIiwianMvZ3RlLmpzIiwianMvZ3RwLmpzIiwianMvaGlzdG9yeS5qcyIsImpzL2lmZWxzZWlmLmpzIiwianMvaW4uanMiLCJqcy9pbmRleC5qcyIsImpzL2x0LmpzIiwianMvbHRlLmpzIiwianMvbHRwLmpzIiwianMvbWF4LmpzIiwianMvbWVtby5qcyIsImpzL21pbi5qcyIsImpzL21peC5qcyIsImpzL21vZC5qcyIsImpzL21zdG9zYW1wcy5qcyIsImpzL210b2YuanMiLCJqcy9tdWwuanMiLCJqcy9uZXEuanMiLCJqcy9ub2lzZS5qcyIsImpzL25vdC5qcyIsImpzL3Bhbi5qcyIsImpzL3BhcmFtLmpzIiwianMvcGVlay5qcyIsImpzL3BoYXNvci5qcyIsImpzL3Bva2UuanMiLCJqcy9wb3cuanMiLCJqcy9wcm9jZXNzLmpzIiwianMvcmF0ZS5qcyIsImpzL3JvdW5kLmpzIiwianMvc2FoLmpzIiwianMvc2VsZWN0b3IuanMiLCJqcy9zZXEuanMiLCJqcy9zaWduLmpzIiwianMvc2luLmpzIiwianMvc2xpZGUuanMiLCJqcy9zdWIuanMiLCJqcy9zd2l0Y2guanMiLCJqcy90NjAuanMiLCJqcy90YW4uanMiLCJqcy90YW5oLmpzIiwianMvdHJhaW4uanMiLCJqcy91dGlsaXRpZXMuanMiLCJqcy93aW5kb3dzLmpzIiwianMvd3JhcC5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIiwibm9kZV9tb2R1bGVzL21lbW9yeS1oZWxwZXIvaW5kZXgudHJhbnNwaWxlZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7O0FBRUEsSUFBSSxPQUFPLFFBQVEsVUFBUixDQUFYOztBQUVBLElBQUksUUFBUTtBQUNWLFFBQUssS0FESzs7QUFHVixLQUhVLGlCQUdKO0FBQ0osUUFBSSxZQUFKO0FBQUEsUUFDSSxTQUFTLEtBQUksU0FBSixDQUFlLElBQWYsQ0FEYjs7QUFHQSxRQUFNLFlBQVksS0FBSSxJQUFKLEtBQWEsU0FBL0I7QUFDQSxRQUFNLE1BQU0sWUFBWSxFQUFaLEdBQWlCLE1BQTdCOztBQUVBLFFBQUksTUFBTyxPQUFPLENBQVAsQ0FBUCxDQUFKLEVBQXlCO0FBQ3ZCLFdBQUksUUFBSixDQUFhLEdBQWIscUJBQXFCLEtBQUssSUFBMUIsRUFBa0MsWUFBWSxVQUFaLEdBQXlCLEtBQUssR0FBaEU7O0FBRUEsWUFBUyxHQUFULGFBQW9CLE9BQU8sQ0FBUCxDQUFwQjtBQUVELEtBTEQsTUFLTztBQUNMLFlBQU0sS0FBSyxHQUFMLENBQVUsV0FBWSxPQUFPLENBQVAsQ0FBWixDQUFWLENBQU47QUFDRDs7QUFFRCxXQUFPLEdBQVA7QUFDRDtBQXBCUyxDQUFaOztBQXVCQSxPQUFPLE9BQVAsR0FBaUIsYUFBSztBQUNwQixNQUFJLE1BQU0sT0FBTyxNQUFQLENBQWUsS0FBZixDQUFWOztBQUVBLE1BQUksTUFBSixHQUFhLENBQUUs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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2dCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIG5hbWU6J2FicycsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuXG4gICAgY29uc3QgaXNXb3JrbGV0ID0gZ2VuLm1vZGUgPT09ICd3b3JrbGV0J1xuICAgIGNvbnN0IHJlZiA9IGlzV29ya2xldCA/ICcnIDogJ2dlbi4nXG5cbiAgICBpZiggaXNOYU4oIGlucHV0c1swXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7IFsgdGhpcy5uYW1lIF06IGlzV29ya2xldCA/ICdNYXRoLmFicycgOiBNYXRoLmFicyB9KVxuXG4gICAgICBvdXQgPSBgJHtyZWZ9YWJzKCAke2lucHV0c1swXX0gKWBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLmFicyggcGFyc2VGbG9hdCggaW5wdXRzWzBdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IGFicyA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBhYnMuaW5wdXRzID0gWyB4IF1cblxuICByZXR1cm4gYWJzXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2FjY3VtJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGNvZGUsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSxcbiAgICAgICAgZ2VuTmFtZSA9ICdnZW4uJyArIHRoaXMubmFtZSxcbiAgICAgICAgZnVuY3Rpb25Cb2R5XG5cbiAgICBnZW4ucmVxdWVzdE1lbW9yeSggdGhpcy5tZW1vcnkgKVxuXG4gICAgZ2VuLm1lbW9yeS5oZWFwWyB0aGlzLm1lbW9yeS52YWx1ZS5pZHggXSA9IHRoaXMuaW5pdGlhbFZhbHVlXG5cbiAgICBmdW5jdGlvbkJvZHkgPSB0aGlzLmNhbGxiYWNrKCBnZW5OYW1lLCBpbnB1dHNbMF0sIGlucHV0c1sxXSwgYG1lbW9yeVske3RoaXMubWVtb3J5LnZhbHVlLmlkeH1dYCApXG5cbiAgICAvL2dlbi5jbG9zdXJlcy5hZGQoeyBbIHRoaXMubmFtZSBdOiB0aGlzIH0pIFxuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lICsgJ192YWx1ZSdcbiAgICBcbiAgICByZXR1cm4gWyB0aGlzLm5hbWUgKyAnX3ZhbHVlJywgZnVuY3Rpb25Cb2R5IF1cbiAgfSxcblxuICBjYWxsYmFjayggX25hbWUsIF9pbmNyLCBfcmVzZXQsIHZhbHVlUmVmICkge1xuICAgIGxldCBkaWZmID0gdGhpcy5tYXggLSB0aGlzLm1pbixcbiAgICAgICAgb3V0ID0gJycsXG4gICAgICAgIHdyYXAgPSAnJ1xuICAgIFxuICAgIC8qIHRocmVlIGRpZmZlcmVudCBtZXRob2RzIG9mIHdyYXBwaW5nLCB0aGlyZCBpcyBtb3N0IGV4cGVuc2l2ZTpcbiAgICAgKlxuICAgICAqIDE6IHJhbmdlIHswLDF9OiB5ID0geCAtICh4IHwgMClcbiAgICAgKiAyOiBsb2cyKHRoaXMubWF4KSA9PSBpbnRlZ2VyOiB5ID0geCAmICh0aGlzLm1heCAtIDEpXG4gICAgICogMzogYWxsIG90aGVyczogaWYoIHggPj0gdGhpcy5tYXggKSB5ID0gdGhpcy5tYXggLXhcbiAgICAgKlxuICAgICAqL1xuXG4gICAgLy8gbXVzdCBjaGVjayBmb3IgcmVzZXQgYmVmb3JlIHN0b3JpbmcgdmFsdWUgZm9yIG91dHB1dFxuICAgIGlmKCAhKHR5cGVvZiB0aGlzLmlucHV0c1sxXSA9PT0gJ251bWJlcicgJiYgdGhpcy5pbnB1dHNbMV0gPCAxKSApIHsgXG4gICAgICBpZiggdGhpcy5yZXNldFZhbHVlICE9PSB0aGlzLm1pbiApIHtcblxuICAgICAgICBvdXQgKz0gYCAgaWYoICR7X3Jlc2V0fSA+PTEgKSAke3ZhbHVlUmVmfSA9ICR7dGhpcy5yZXNldFZhbHVlfVxcblxcbmBcbiAgICAgICAgLy9vdXQgKz0gYCAgaWYoICR7X3Jlc2V0fSA+PTEgKSAke3ZhbHVlUmVmfSA9ICR7dGhpcy5taW59XFxuXFxuYFxuICAgICAgfWVsc2V7XG4gICAgICAgIG91dCArPSBgICBpZiggJHtfcmVzZXR9ID49MSApICR7dmFsdWVSZWZ9ID0gJHt0aGlzLm1pbn1cXG5cXG5gXG4gICAgICAgIC8vb3V0ICs9IGAgIGlmKCAke19yZXNldH0gPj0xICkgJHt2YWx1ZVJlZn0gPSAke3RoaXMuaW5pdGlhbFZhbHVlfVxcblxcbmBcbiAgICAgIH1cbiAgICB9XG5cbiAgICBvdXQgKz0gYCAgdmFyICR7dGhpcy5uYW1lfV92YWx1ZSA9ICR7dmFsdWVSZWZ9XFxuYFxuICAgIFxuICAgIGlmKCB0aGlzLnNob3VsZFdyYXAgPT09IGZhbHNlICYmIHRoaXMuc2hvdWxkQ2xhbXAgPT09IHRydWUgKSB7XG4gICAgICBvdXQgKz0gYCAgaWYoICR7dmFsdWVSZWZ9IDwgJHt0aGlzLm1heCB9ICkgJHt2YWx1ZVJlZn0gKz0gJHtfaW5jcn1cXG5gXG4gICAgfWVsc2V7XG4gICAgICBvdXQgKz0gYCAgJHt2YWx1ZVJlZn0gKz0gJHtfaW5jcn1cXG5gIC8vIHN0b3JlIG91dHB1dCB2YWx1ZSBiZWZvcmUgYWNjdW11bGF0aW5nICBcbiAgICB9XG5cbiAgICBpZiggdGhpcy5tYXggIT09IEluZmluaXR5ICAmJiB0aGlzLnNob3VsZFdyYXBNYXggKSB3cmFwICs9IGAgIGlmKCAke3ZhbHVlUmVmfSA+PSAke3RoaXMubWF4fSApICR7dmFsdWVSZWZ9IC09ICR7ZGlmZn1cXG5gXG4gICAgaWYoIHRoaXMubWluICE9PSAtSW5maW5pdHkgJiYgdGhpcy5zaG91bGRXcmFwTWluICkgd3JhcCArPSBgICBpZiggJHt2YWx1ZVJlZn0gPCAke3RoaXMubWlufSApICR7dmFsdWVSZWZ9ICs9ICR7ZGlmZn1cXG5gXG5cbiAgICAvL2lmKCB0aGlzLm1pbiA9PT0gMCAmJiB0aGlzLm1heCA9PT0gMSApIHsgXG4gICAgLy8gIHdyYXAgPSAgYCAgJHt2YWx1ZVJlZn0gPSAke3ZhbHVlUmVmfSAtICgke3ZhbHVlUmVmfSB8IDApXFxuXFxuYFxuICAgIC8vfSBlbHNlIGlmKCB0aGlzLm1pbiA9PT0gMCAmJiAoIE1hdGgubG9nMiggdGhpcy5tYXggKSB8IDAgKSA9PT0gTWF0aC5sb2cyKCB0aGlzLm1heCApICkge1xuICAgIC8vICB3cmFwID0gIGAgICR7dmFsdWVSZWZ9ID0gJHt2YWx1ZVJlZn0gJiAoJHt0aGlzLm1heH0gLSAxKVxcblxcbmBcbiAgICAvL30gZWxzZSBpZiggdGhpcy5tYXggIT09IEluZmluaXR5ICl7XG4gICAgLy8gIHdyYXAgPSBgICBpZiggJHt2YWx1ZVJlZn0gPj0gJHt0aGlzLm1heH0gKSAke3ZhbHVlUmVmfSAtPSAke2RpZmZ9XFxuXFxuYFxuICAgIC8vfVxuXG4gICAgb3V0ID0gb3V0ICsgd3JhcCArICdcXG4nXG5cbiAgICByZXR1cm4gb3V0XG4gIH0sXG5cbiAgZGVmYXVsdHMgOiB7IG1pbjowLCBtYXg6MSwgcmVzZXRWYWx1ZTowLCBpbml0aWFsVmFsdWU6MCwgc2hvdWxkV3JhcDp0cnVlLCBzaG91bGRXcmFwTWF4OiB0cnVlLCBzaG91bGRXcmFwTWluOnRydWUsIHNob3VsZENsYW1wOmZhbHNlIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIGluY3IsIHJlc2V0PTAsIHByb3BlcnRpZXMgKSA9PiB7XG4gIGNvbnN0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG4gICAgICBcbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwgXG4gICAgeyBcbiAgICAgIHVpZDogICAgZ2VuLmdldFVJRCgpLFxuICAgICAgaW5wdXRzOiBbIGluY3IsIHJlc2V0IF0sXG4gICAgICBtZW1vcnk6IHtcbiAgICAgICAgdmFsdWU6IHsgbGVuZ3RoOjEsIGlkeDpudWxsIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHByb3RvLmRlZmF1bHRzLFxuICAgIHByb3BlcnRpZXMgXG4gIClcblxuICBpZiggcHJvcGVydGllcyAhPT0gdW5kZWZpbmVkICYmIHByb3BlcnRpZXMuc2hvdWxkV3JhcE1heCA9PT0gdW5kZWZpbmVkICYmIHByb3BlcnRpZXMuc2hvdWxkV3JhcE1pbiA9PT0gdW5kZWZpbmVkICkge1xuICAgIGlmKCBwcm9wZXJ0aWVzLnNob3VsZFdyYXAgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgIHVnZW4uc2hvdWxkV3JhcE1pbiA9IHVnZW4uc2hvdWxkV3JhcE1heCA9IHByb3BlcnRpZXMuc2hvdWxkV3JhcFxuICAgIH1cbiAgfVxuXG4gIGlmKCBwcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQgJiYgcHJvcGVydGllcy5yZXNldFZhbHVlID09PSB1bmRlZmluZWQgKSB7XG4gICAgdWdlbi5yZXNldFZhbHVlID0gdWdlbi5taW5cbiAgfVxuXG4gIGlmKCB1Z2VuLmluaXRpYWxWYWx1ZSA9PT0gdW5kZWZpbmVkICkgdWdlbi5pbml0aWFsVmFsdWUgPSB1Z2VuLm1pblxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdWdlbiwgJ3ZhbHVlJywge1xuICAgIGdldCgpICB7IFxuICAgICAgLy9jb25zb2xlLmxvZyggJ2dlbjonLCBnZW4sIGdlbi5tZW1vcnkgKVxuICAgICAgcmV0dXJuIGdlbi5tZW1vcnkuaGVhcFsgdGhpcy5tZW1vcnkudmFsdWUuaWR4IF0gXG4gICAgfSxcbiAgICBzZXQodikgeyBnZW4ubWVtb3J5LmhlYXBbIHRoaXMubWVtb3J5LnZhbHVlLmlkeCBdID0gdiB9XG4gIH0pXG5cbiAgdWdlbi5uYW1lID0gYCR7dWdlbi5iYXNlbmFtZX0ke3VnZW4udWlkfWBcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidhY29zJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG4gICAgXG5cbiAgICBjb25zdCBpc1dvcmtsZXQgPSBnZW4ubW9kZSA9PT0gJ3dvcmtsZXQnXG4gICAgY29uc3QgcmVmID0gaXNXb3JrbGV0ID8gJycgOiAnZ2VuLidcblxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICBnZW4uY2xvc3VyZXMuYWRkKHsgJ2Fjb3MnOiBpc1dvcmtsZXQgPyAnTWF0aC5hY29zJyA6TWF0aC5hY29zIH0pXG5cbiAgICAgIG91dCA9IGAke3JlZn1hY29zKCAke2lucHV0c1swXX0gKWAgXG5cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gTWF0aC5hY29zKCBwYXJzZUZsb2F0KCBpbnB1dHNbMF0gKSApXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHggPT4ge1xuICBsZXQgYWNvcyA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBhY29zLmlucHV0cyA9IFsgeCBdXG4gIGFjb3MuaWQgPSBnZW4uZ2V0VUlEKClcbiAgYWNvcy5uYW1lID0gYCR7YWNvcy5iYXNlbmFtZX17YWNvcy5pZH1gXG5cbiAgcmV0dXJuIGFjb3Ncbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICAgICAgPSByZXF1aXJlKCAnLi9nZW4uanMnICksXG4gICAgbXVsICAgICAgPSByZXF1aXJlKCAnLi9tdWwuanMnICksXG4gICAgc3ViICAgICAgPSByZXF1aXJlKCAnLi9zdWIuanMnICksXG4gICAgZGl2ICAgICAgPSByZXF1aXJlKCAnLi9kaXYuanMnICksXG4gICAgZGF0YSAgICAgPSByZXF1aXJlKCAnLi9kYXRhLmpzJyApLFxuICAgIHBlZWsgICAgID0gcmVxdWlyZSggJy4vcGVlay5qcycgKSxcbiAgICBhY2N1bSAgICA9IHJlcXVpcmUoICcuL2FjY3VtLmpzJyApLFxuICAgIGlmZWxzZSAgID0gcmVxdWlyZSggJy4vaWZlbHNlaWYuanMnICksXG4gICAgbHQgICAgICAgPSByZXF1aXJlKCAnLi9sdC5qcycgKSxcbiAgICBiYW5nICAgICA9IHJlcXVpcmUoICcuL2JhbmcuanMnICksXG4gICAgZW52ICAgICAgPSByZXF1aXJlKCAnLi9lbnYuanMnICksXG4gICAgYWRkICAgICAgPSByZXF1aXJlKCAnLi9hZGQuanMnICksXG4gICAgcG9rZSAgICAgPSByZXF1aXJlKCAnLi9wb2tlLmpzJyApLFxuICAgIG5lcSAgICAgID0gcmVxdWlyZSggJy4vbmVxLmpzJyApLFxuICAgIGFuZCAgICAgID0gcmVxdWlyZSggJy4vYW5kLmpzJyApLFxuICAgIGd0ZSAgICAgID0gcmVxdWlyZSggJy4vZ3RlLmpzJyApLFxuICAgIG1lbW8gICAgID0gcmVxdWlyZSggJy4vbWVtby5qcycgKSxcbiAgICB1dGlsaXRpZXM9IHJlcXVpcmUoICcuL3V0aWxpdGllcy5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggYXR0YWNrVGltZSA9IDQ0MTAwLCBkZWNheVRpbWUgPSA0NDEwMCwgX3Byb3BzICkgPT4ge1xuICBjb25zdCBwcm9wcyA9IE9iamVjdC5hc3NpZ24oe30sIHsgc2hhcGU6J2V4cG9uZW50aWFsJywgYWxwaGE6NSwgdHJpZ2dlcjpudWxsIH0sIF9wcm9wcyApXG4gIGNvbnN0IF9iYW5nID0gcHJvcHMudHJpZ2dlciAhPT0gbnVsbCA/IHByb3BzLnRyaWdnZXIgOiBiYW5nKCksXG4gICAgICAgIHBoYXNlID0gYWNjdW0oIDEsIF9iYW5nLCB7IG1pbjowLCBtYXg6IEluZmluaXR5LCBpbml0aWFsVmFsdWU6LUluZmluaXR5LCBzaG91bGRXcmFwOmZhbHNlIH0pXG4gICAgICBcbiAgbGV0IGJ1ZmZlckRhdGEsIGJ1ZmZlckRhdGFSZXZlcnNlLCBkZWNheURhdGEsIG91dCwgYnVmZmVyXG5cbiAgLy9jb25zb2xlLmxvZyggJ3NoYXBlOicsIHByb3BzLnNoYXBlLCAnYXR0YWNrIHRpbWU6JywgYXR0YWNrVGltZSwgJ2RlY2F5IHRpbWU6JywgZGVjYXlUaW1lIClcbiAgbGV0IGNvbXBsZXRlRmxhZyA9IGRhdGEoIFswXSApXG4gIFxuICAvLyBzbGlnaHRseSBtb3JlIGVmZmljaWVudCB0byB1c2UgZXhpc3RpbmcgcGhhc2UgYWNjdW11bGF0b3IgZm9yIGxpbmVhciBlbnZlbG9wZXNcbiAgaWYoIHByb3BzLnNoYXBlID09PSAnbGluZWFyJyApIHtcbiAgICBvdXQgPSBpZmVsc2UoIFxuICAgICAgYW5kKCBndGUoIHBoYXNlLCAwKSwgbHQoIHBoYXNlLCBhdHRhY2tUaW1lICkpLFxuICAgICAgZGl2KCBwaGFzZSwgYXR0YWNrVGltZSApLFxuXG4gICAgICBhbmQoIGd0ZSggcGhhc2UsIDApLCAgbHQoIHBoYXNlLCBhZGQoIGF0dGFja1RpbWUsIGRlY2F5VGltZSApICkgKSxcbiAgICAgIHN1YiggMSwgZGl2KCBzdWIoIHBoYXNlLCBhdHRhY2tUaW1lICksIGRlY2F5VGltZSApICksXG4gICAgICBcbiAgICAgIG5lcSggcGhhc2UsIC1JbmZpbml0eSksXG4gICAgICBwb2tlKCBjb21wbGV0ZUZsYWcsIDEsIDAsIHsgaW5saW5lOjAgfSksXG5cbiAgICAgIDAgXG4gICAgKVxuICB9IGVsc2Uge1xuICAgIGJ1ZmZlckRhdGEgPSBlbnYoeyBsZW5ndGg6MTAyNCwgdHlwZTpwcm9wcy5zaGFwZSwgYWxwaGE6cHJvcHMuYWxwaGEgfSlcbiAgICBidWZmZXJEYXRhUmV2ZXJzZSA9IGVudih7IGxlbmd0aDoxMDI0LCB0eXBlOnByb3BzLnNoYXBlLCBhbHBoYTpwcm9wcy5hbHBoYSwgcmV2ZXJzZTp0cnVlIH0pXG5cbiAgICBvdXQgPSBpZmVsc2UoIFxuICAgICAgYW5kKCBndGUoIHBoYXNlLCAwKSwgbHQoIHBoYXNlLCBhdHRhY2tUaW1lICkgKSwgXG4gICAgICBwZWVrKCBidWZmZXJEYXRhLCBkaXYoIHBoYXNlLCBhdHRhY2tUaW1lICksIHsgYm91bmRtb2RlOidjbGFtcCcgfSApLCBcblxuICAgICAgYW5kKCBndGUocGhhc2UsMCksIGx0KCBwaGFzZSwgYWRkKCBhdHRhY2tUaW1lLCBkZWNheVRpbWUgKSApICksIFxuICAgICAgcGVlayggYnVmZmVyRGF0YVJldmVyc2UsIGRpdiggc3ViKCBwaGFzZSwgYXR0YWNrVGltZSApLCBkZWNheVRpbWUgKSwgeyBib3VuZG1vZGU6J2NsYW1wJyB9KSxcblxuICAgICAgbmVxKCBwaGFzZSwgLUluZmluaXR5ICksXG4gICAgICBwb2tlKCBjb21wbGV0ZUZsYWcsIDEsIDAsIHsgaW5saW5lOjAgfSksXG5cbiAgICAgIDBcbiAgICApXG4gIH1cblxuICBjb25zdCB1c2luZ1dvcmtsZXQgPSBnZW4ubW9kZSA9PT0gJ3dvcmtsZXQnXG4gIGlmKCB1c2luZ1dvcmtsZXQgPT09IHRydWUgKSB7XG4gICAgb3V0Lm5vZGUgPSBudWxsXG4gICAgdXRpbGl0aWVzLnJlZ2lzdGVyKCBvdXQgKVxuICB9XG5cbiAgLy8gbmVlZGVkIGZvciBnaWJiZXJpc2guLi4gZ2V0dGluZyB0aGlzIHRvIHdvcmsgcmlnaHQgd2l0aCB3b3JrbGV0c1xuICAvLyB2aWEgcHJvbWlzZXMgd2lsbCBwcm9iYWJseSBiZSB0cmlja3lcbiAgb3V0LmlzQ29tcGxldGUgPSAoKT0+IHtcbiAgICBpZiggdXNpbmdXb3JrbGV0ID09PSB0cnVlICYmIG91dC5ub2RlICE9PSBudWxsICkge1xuICAgICAgY29uc3QgcCA9IG5ldyBQcm9taXNlKCByZXNvbHZlID0+IHtcbiAgICAgICAgb3V0Lm5vZGUuZ2V0TWVtb3J5VmFsdWUoIGNvbXBsZXRlRmxhZy5tZW1vcnkudmFsdWVzLmlkeCwgcmVzb2x2ZSApXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gcFxuICAgIH1lbHNle1xuICAgICAgcmV0dXJuIGdlbi5tZW1vcnkuaGVhcFsgY29tcGxldGVGbGFnLm1lbW9yeS52YWx1ZXMuaWR4IF1cbiAgICB9XG4gIH1cblxuICBvdXQudHJpZ2dlciA9ICgpPT4ge1xuICAgIGlmKCB1c2luZ1dvcmtsZXQgPT09IHRydWUgJiYgb3V0Lm5vZGUgIT09IG51bGwgKSB7XG4gICAgICBvdXQubm9kZS5wb3J0LnBvc3RNZXNzYWdlKHsga2V5OidzZXQnLCBpZHg6Y29tcGxldGVGbGFnLm1lbW9yeS52YWx1ZXMuaWR4LCB2YWx1ZTowIH0pXG4gICAgfWVsc2V7XG4gICAgICBnZW4ubWVtb3J5LmhlYXBbIGNvbXBsZXRlRmxhZy5tZW1vcnkudmFsdWVzLmlkeCBdID0gMFxuICAgIH1cbiAgICBfYmFuZy50cmlnZ2VyKClcbiAgfVxuXG4gIHJldHVybiBvdXQgXG59XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgZ2VuID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5jb25zdCBwcm90byA9IHsgXG4gIGJhc2VuYW1lOidhZGQnLFxuICBnZW4oKSB7XG4gICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSxcbiAgICAgICAgb3V0PScnLFxuICAgICAgICBzdW0gPSAwLCBudW1Db3VudCA9IDAsIGFkZGVyQXRFbmQgPSBmYWxzZSwgYWxyZWFkeUZ1bGxTdW1tZWQgPSB0cnVlXG5cbiAgICBpZiggaW5wdXRzLmxlbmd0aCA9PT0gMCApIHJldHVybiAwXG5cbiAgICBvdXQgPSBgICB2YXIgJHt0aGlzLm5hbWV9ID0gYFxuXG4gICAgaW5wdXRzLmZvckVhY2goICh2LGkpID0+IHtcbiAgICAgIGlmKCBpc05hTiggdiApICkge1xuICAgICAgICBvdXQgKz0gdlxuICAgICAgICBpZiggaSA8IGlucHV0cy5sZW5ndGggLTEgKSB7XG4gICAgICAgICAgYWRkZXJBdEVuZCA9IHRydWVcbiAgICAgICAgICBvdXQgKz0gJyArICdcbiAgICAgICAgfVxuICAgICAgICBhbHJlYWR5RnVsbFN1bW1lZCA9IGZhbHNlXG4gICAgICB9ZWxzZXtcbiAgICAgICAgc3VtICs9IHBhcnNlRmxvYXQoIHYgKVxuICAgICAgICBudW1Db3VudCsrXG4gICAgICB9XG4gICAgfSlcblxuICAgIGlmKCBudW1Db3VudCA+IDAgKSB7XG4gICAgICBvdXQgKz0gYWRkZXJBdEVuZCB8fCBhbHJlYWR5RnVsbFN1bW1lZCA/IHN1bSA6ICcgKyAnICsgc3VtXG4gICAgfVxuXG4gICAgb3V0ICs9ICdcXG4nXG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWVcblxuICAgIHJldHVybiBbIHRoaXMubmFtZSwgb3V0IF1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggLi4uYXJncyApID0+IHtcbiAgY29uc3QgYWRkID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuICBhZGQuaWQgPSBnZW4uZ2V0VUlEKClcbiAgYWRkLm5hbWUgPSBhZGQuYmFzZW5hbWUgKyBhZGQuaWRcbiAgYWRkLmlucHV0cyA9IGFyZ3NcblxuICByZXR1cm4gYWRkXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgICAgID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApLFxuICAgIG11bCAgICAgID0gcmVxdWlyZSggJy4vbXVsLmpzJyApLFxuICAgIHN1YiAgICAgID0gcmVxdWlyZSggJy4vc3ViLmpzJyApLFxuICAgIGRpdiAgICAgID0gcmVxdWlyZSggJy4vZGl2LmpzJyApLFxuICAgIGRhdGEgICAgID0gcmVxdWlyZSggJy4vZGF0YS5qcycgKSxcbiAgICBwZWVrICAgICA9IHJlcXVpcmUoICcuL3BlZWsuanMnICksXG4gICAgYWNjdW0gICAgPSByZXF1aXJlKCAnLi9hY2N1bS5qcycgKSxcbiAgICBpZmVsc2UgICA9IHJlcXVpcmUoICcuL2lmZWxzZWlmLmpzJyApLFxuICAgIGx0ICAgICAgID0gcmVxdWlyZSggJy4vbHQuanMnICksXG4gICAgYmFuZyAgICAgPSByZXF1aXJlKCAnLi9iYW5nLmpzJyApLFxuICAgIGVudiAgICAgID0gcmVxdWlyZSggJy4vZW52LmpzJyApLFxuICAgIHBhcmFtICAgID0gcmVxdWlyZSggJy4vcGFyYW0uanMnICksXG4gICAgYWRkICAgICAgPSByZXF1aXJlKCAnLi9hZGQuanMnICksXG4gICAgZ3RwICAgICAgPSByZXF1aXJlKCAnLi9ndHAuanMnICksXG4gICAgbm90ICAgICAgPSByZXF1aXJlKCAnLi9ub3QuanMnICksXG4gICAgYW5kICAgICAgPSByZXF1aXJlKCAnLi9hbmQuanMnICksXG4gICAgbmVxICAgICAgPSByZXF1aXJlKCAnLi9uZXEuanMnICksXG4gICAgcG9rZSAgICAgPSByZXF1aXJlKCAnLi9wb2tlLmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gKCBhdHRhY2tUaW1lPTQ0LCBkZWNheVRpbWU9MjIwNTAsIHN1c3RhaW5UaW1lPTQ0MTAwLCBzdXN0YWluTGV2ZWw9LjYsIHJlbGVhc2VUaW1lPTQ0MTAwLCBfcHJvcHMgKSA9PiB7XG4gIGxldCBlbnZUcmlnZ2VyID0gYmFuZygpLFxuICAgICAgcGhhc2UgPSBhY2N1bSggMSwgZW52VHJpZ2dlciwgeyBtYXg6IEluZmluaXR5LCBzaG91bGRXcmFwOmZhbHNlLCBpbml0aWFsVmFsdWU6SW5maW5pdHkgfSksXG4gICAgICBzaG91bGRTdXN0YWluID0gcGFyYW0oIDEgKSxcbiAgICAgIGRlZmF1bHRzID0ge1xuICAgICAgICAgc2hhcGU6ICdleHBvbmVudGlhbCcsXG4gICAgICAgICBhbHBoYTogNSxcbiAgICAgICAgIHRyaWdnZXJSZWxlYXNlOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBwcm9wcyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBfcHJvcHMgKSxcbiAgICAgIGJ1ZmZlckRhdGEsIGRlY2F5RGF0YSwgb3V0LCBidWZmZXIsIHN1c3RhaW5Db25kaXRpb24sIHJlbGVhc2VBY2N1bSwgcmVsZWFzZUNvbmRpdGlvblxuXG5cbiAgY29uc3QgY29tcGxldGVGbGFnID0gZGF0YSggWzBdIClcblxuICBidWZmZXJEYXRhID0gZW52KHsgbGVuZ3RoOjEwMjQsIGFscGhhOnByb3BzLmFscGhhLCBzaGlmdDowLCB0eXBlOnByb3BzLnNoYXBlIH0pXG5cbiAgc3VzdGFpbkNvbmRpdGlvbiA9IHByb3BzLnRyaWdnZXJSZWxlYXNlIFxuICAgID8gc2hvdWxkU3VzdGFpblxuICAgIDogbHQoIHBoYXNlLCBhZGQoIGF0dGFja1RpbWUsIGRlY2F5VGltZSwgc3VzdGFpblRpbWUgKSApXG5cbiAgcmVsZWFzZUFjY3VtID0gcHJvcHMudHJpZ2dlclJlbGVhc2VcbiAgICA/IGd0cCggc3ViKCBzdXN0YWluTGV2ZWwsIGFjY3VtKCBkaXYoIHN1c3RhaW5MZXZlbCwgcmVsZWFzZVRpbWUgKSAsIDAsIHsgc2hvdWxkV3JhcDpmYWxzZSB9KSApLCAwIClcbiAgICA6IHN1Yiggc3VzdGFpbkxldmVsLCBtdWwoIGRpdiggc3ViKCBwaGFzZSwgYWRkKCBhdHRhY2tUaW1lLCBkZWNheVRpbWUsIHN1c3RhaW5UaW1lICkgKSwgcmVsZWFzZVRpbWUgKSwgc3VzdGFpbkxldmVsICkgKSwgXG5cbiAgcmVsZWFzZUNvbmRpdGlvbiA9IHByb3BzLnRyaWdnZXJSZWxlYXNlXG4gICAgPyBub3QoIHNob3VsZFN1c3RhaW4gKVxuICAgIDogbHQoIHBoYXNlLCBhZGQoIGF0dGFja1RpbWUsIGRlY2F5VGltZSwgc3VzdGFpblRpbWUsIHJlbGVhc2VUaW1lICkgKVxuXG4gIG91dCA9IGlmZWxzZShcbiAgICAvLyBhdHRhY2sgXG4gICAgbHQoIHBoYXNlLCAgYXR0YWNrVGltZSApLCBcbiAgICBwZWVrKCBidWZmZXJEYXRhLCBkaXYoIHBoYXNlLCBhdHRhY2tUaW1lICksIHsgYm91bmRtb2RlOidjbGFtcCcgfSApLCBcblxuICAgIC8vIGRlY2F5XG4gICAgbHQoIHBoYXNlLCBhZGQoIGF0dGFja1RpbWUsIGRlY2F5VGltZSApICksIFxuICAgIHBlZWsoIGJ1ZmZlckRhdGEsIHN1YiggMSwgbXVsKCBkaXYoIHN1YiggcGhhc2UsICBhdHRhY2tUaW1lICksICBkZWNheVRpbWUgKSwgc3ViKCAxLCAgc3VzdGFpbkxldmVsICkgKSApLCB7IGJvdW5kbW9kZTonY2xhbXAnIH0pLFxuXG4gICAgLy8gc3VzdGFpblxuICAgIGFuZCggc3VzdGFpbkNvbmRpdGlvbiwgbmVxKCBwaGFzZSwgSW5maW5pdHkgKSApLFxuICAgIHBlZWsoIGJ1ZmZlckRhdGEsICBzdXN0YWluTGV2ZWwgKSxcblxuICAgIC8vIHJlbGVhc2VcbiAgICByZWxlYXNlQ29uZGl0aW9uLCAvL2x0KCBwaGFzZSwgIGF0dGFja1RpbWUgKyAgZGVjYXlUaW1lICsgIHN1c3RhaW5UaW1lICsgIHJlbGVhc2VUaW1lICksXG4gICAgcGVlayggXG4gICAgICBidWZmZXJEYXRhLFxuICAgICAgcmVsZWFzZUFjY3VtLCBcbiAgICAgIC8vc3ViKCAgc3VzdGFpbkxldmVsLCBtdWwoIGRpdiggc3ViKCBwaGFzZSwgIGF0dGFja1RpbWUgKyAgZGVjYXlUaW1lICsgIHN1c3RhaW5UaW1lKSwgIHJlbGVhc2VUaW1lICksICBzdXN0YWluTGV2ZWwgKSApLCBcbiAgICAgIHsgYm91bmRtb2RlOidjbGFtcCcgfVxuICAgICksXG5cbiAgICBuZXEoIHBoYXNlLCBJbmZpbml0eSApLFxuICAgIHBva2UoIGNvbXBsZXRlRmxhZywgMSwgMCwgeyBpbmxpbmU6MCB9KSxcblxuICAgIDBcbiAgKVxuICAgXG4gIGNvbnN0IHVzaW5nV29ya2xldCA9IGdlbi5tb2RlID09PSAnd29ya2xldCdcbiAgaWYoIHVzaW5nV29ya2xldCA9PT0gdHJ1ZSApIHtcbiAgICBvdXQubm9kZSA9IG51bGxcbiAgICB1dGlsaXRpZXMucmVnaXN0ZXIoIG91dCApXG4gIH1cblxuICBvdXQudHJpZ2dlciA9ICgpPT4ge1xuICAgIHNob3VsZFN1c3RhaW4udmFsdWUgPSAxXG4gICAgZW52VHJpZ2dlci50cmlnZ2VyKClcbiAgfVxuIFxuICAvLyBuZWVkZWQgZm9yIGdpYmJlcmlzaC4uLiBnZXR0aW5nIHRoaXMgdG8gd29yayByaWdodCB3aXRoIHdvcmtsZXRzXG4gIC8vIHZpYSBwcm9taXNlcyB3aWxsIHByb2JhYmx5IGJlIHRyaWNreVxuICBvdXQuaXNDb21wbGV0ZSA9ICgpPT4ge1xuICAgIGlmKCB1c2luZ1dvcmtsZXQgPT09IHRydWUgJiYgb3V0Lm5vZGUgIT09IG51bGwgKSB7XG4gICAgICBjb25zdCBwID0gbmV3IFByb21pc2UoIHJlc29sdmUgPT4ge1xuICAgICAgICBvdXQubm9kZS5nZXRNZW1vcnlWYWx1ZSggY29tcGxldGVGbGFnLm1lbW9yeS52YWx1ZXMuaWR4LCByZXNvbHZlIClcbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBwXG4gICAgfWVsc2V7XG4gICAgICByZXR1cm4gZ2VuLm1lbW9yeS5oZWFwWyBjb21wbGV0ZUZsYWcubWVtb3J5LnZhbHVlcy5pZHggXVxuICAgIH1cbiAgfVxuXG5cbiAgb3V0LnJlbGVhc2UgPSAoKT0+IHtcbiAgICBzaG91bGRTdXN0YWluLnZhbHVlID0gMFxuICAgIC8vIFhYWCBwcmV0dHkgbmFzdHkuLi4gZ3JhYnMgYWNjdW0gaW5zaWRlIG9mIGd0cCBhbmQgcmVzZXRzIHZhbHVlIG1hbnVhbGx5XG4gICAgLy8gdW5mb3J0dW5hdGVseSBlbnZUcmlnZ2VyIHdvbid0IHdvcmsgYXMgaXQncyBiYWNrIHRvIDAgYnkgdGhlIHRpbWUgdGhlIHJlbGVhc2UgYmxvY2sgaXMgdHJpZ2dlcmVkLi4uXG4gICAgaWYoIHVzaW5nV29ya2xldCAmJiBvdXQubm9kZSAhPT0gbnVsbCApIHtcbiAgICAgIG91dC5ub2RlLnBvcnQucG9zdE1lc3NhZ2UoeyBrZXk6J3NldCcsIGlkeDpyZWxlYXNlQWNjdW0uaW5wdXRzWzBdLmlucHV0c1sxXS5tZW1vcnkudmFsdWUuaWR4LCB2YWx1ZTowIH0pXG4gICAgfWVsc2V7XG4gICAgICBnZW4ubWVtb3J5LmhlYXBbIHJlbGVhc2VBY2N1bS5pbnB1dHNbMF0uaW5wdXRzWzFdLm1lbW9yeS52YWx1ZS5pZHggXSA9IDBcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3V0IFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gPSByZXF1aXJlKCAnLi9nZW4uanMnIClcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonYW5kJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSwgb3V0XG5cbiAgICBvdXQgPSBgICB2YXIgJHt0aGlzLm5hbWV9ID0gKCR7aW5wdXRzWzBdfSAhPT0gMCAmJiAke2lucHV0c1sxXX0gIT09IDApIHwgMFxcblxcbmBcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IGAke3RoaXMubmFtZX1gXG5cbiAgICByZXR1cm4gWyBgJHt0aGlzLm5hbWV9YCwgb3V0IF1cbiAgfSxcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW4xLCBpbjIgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7XG4gICAgdWlkOiAgICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogIFsgaW4xLCBpbjIgXSxcbiAgfSlcbiAgXG4gIHVnZW4ubmFtZSA9IGAke3VnZW4uYmFzZW5hbWV9JHt1Z2VuLnVpZH1gXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonYXNpbicsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuICAgIFxuICAgIGNvbnN0IGlzV29ya2xldCA9IGdlbi5tb2RlID09PSAnd29ya2xldCdcbiAgICBjb25zdCByZWYgPSBpc1dvcmtsZXQgPyAnJyA6ICdnZW4uJ1xuXG4gICAgaWYoIGlzTmFOKCBpbnB1dHNbMF0gKSApIHtcbiAgICAgIGdlbi5jbG9zdXJlcy5hZGQoeyAnYXNpbic6IGlzV29ya2xldCA/ICdNYXRoLnNpbicgOiBNYXRoLmFzaW4gfSlcblxuICAgICAgb3V0ID0gYCR7cmVmfWFzaW4oICR7aW5wdXRzWzBdfSApYCBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLmFzaW4oIHBhcnNlRmxvYXQoIGlucHV0c1swXSApIClcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geCA9PiB7XG4gIGxldCBhc2luID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIGFzaW4uaW5wdXRzID0gWyB4IF1cbiAgYXNpbi5pZCA9IGdlbi5nZXRVSUQoKVxuICBhc2luLm5hbWUgPSBgJHthc2luLmJhc2VuYW1lfXthc2luLmlkfWBcblxuICByZXR1cm4gYXNpblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidhdGFuJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG4gICAgXG4gICAgY29uc3QgaXNXb3JrbGV0ID0gZ2VuLm1vZGUgPT09ICd3b3JrbGV0J1xuICAgIGNvbnN0IHJlZiA9IGlzV29ya2xldCA/ICcnIDogJ2dlbi4nXG5cbiAgICBpZiggaXNOYU4oIGlucHV0c1swXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7ICdhdGFuJzogaXNXb3JrbGV0ID8gJ01hdGguYXRhbicgOiBNYXRoLmF0YW4gfSlcblxuICAgICAgb3V0ID0gYCR7cmVmfWF0YW4oICR7aW5wdXRzWzBdfSApYCBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLmF0YW4oIHBhcnNlRmxvYXQoIGlucHV0c1swXSApIClcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geCA9PiB7XG4gIGxldCBhdGFuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIGF0YW4uaW5wdXRzID0gWyB4IF1cbiAgYXRhbi5pZCA9IGdlbi5nZXRVSUQoKVxuICBhdGFuLm5hbWUgPSBgJHthdGFuLmJhc2VuYW1lfXthdGFuLmlkfWBcblxuICByZXR1cm4gYXRhblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gICAgID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApLFxuICAgIGhpc3RvcnkgPSByZXF1aXJlKCAnLi9oaXN0b3J5LmpzJyApLFxuICAgIG11bCAgICAgPSByZXF1aXJlKCAnLi9tdWwuanMnICksXG4gICAgc3ViICAgICA9IHJlcXVpcmUoICcuL3N1Yi5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggZGVjYXlUaW1lID0gNDQxMDAgKSA9PiB7XG4gIGxldCBzc2QgPSBoaXN0b3J5ICggMSApLFxuICAgICAgdDYwID0gTWF0aC5leHAoIC02LjkwNzc1NTI3ODkyMSAvIGRlY2F5VGltZSApXG5cbiAgc3NkLmluKCBtdWwoIHNzZC5vdXQsIHQ2MCApIClcblxuICBzc2Qub3V0LnRyaWdnZXIgPSAoKT0+IHtcbiAgICBzc2QudmFsdWUgPSAxXG4gIH1cblxuICByZXR1cm4gc3ViKCAxLCBzc2Qub3V0IClcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGdlbigpIHtcbiAgICBnZW4ucmVxdWVzdE1lbW9yeSggdGhpcy5tZW1vcnkgKVxuICAgIFxuICAgIGxldCBvdXQgPSBcbmAgIHZhciAke3RoaXMubmFtZX0gPSBtZW1vcnlbJHt0aGlzLm1lbW9yeS52YWx1ZS5pZHh9XVxuICBpZiggJHt0aGlzLm5hbWV9ID09PSAxICkgbWVtb3J5WyR7dGhpcy5tZW1vcnkudmFsdWUuaWR4fV0gPSAwICAgICAgXG4gICAgICBcbmBcbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWVcblxuICAgIHJldHVybiBbIHRoaXMubmFtZSwgb3V0IF1cbiAgfSBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIF9wcm9wcyApID0+IHtcbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApLFxuICAgICAgcHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCB7IG1pbjowLCBtYXg6MSB9LCBfcHJvcHMgKVxuXG4gIHVnZW4ubmFtZSA9ICdiYW5nJyArIGdlbi5nZXRVSUQoKVxuXG4gIHVnZW4ubWluID0gcHJvcHMubWluXG4gIHVnZW4ubWF4ID0gcHJvcHMubWF4XG5cbiAgY29uc3QgdXNpbmdXb3JrbGV0ID0gZ2VuLm1vZGUgPT09ICd3b3JrbGV0J1xuICBpZiggdXNpbmdXb3JrbGV0ID09PSB0cnVlICkge1xuICAgIHVnZW4ubm9kZSA9IG51bGxcbiAgICB1dGlsaXRpZXMucmVnaXN0ZXIoIHVnZW4gKVxuICB9XG5cbiAgdWdlbi50cmlnZ2VyID0gKCkgPT4ge1xuICAgIGlmKCB1c2luZ1dvcmtsZXQgPT09IHRydWUgJiYgdWdlbi5ub2RlICE9PSBudWxsICkge1xuICAgICAgdWdlbi5ub2RlLnBvcnQucG9zdE1lc3NhZ2UoeyBrZXk6J3NldCcsIGlkeDp1Z2VuLm1lbW9yeS52YWx1ZS5pZHgsIHZhbHVlOnVnZW4ubWF4IH0pXG4gICAgfWVsc2V7XG4gICAgICBnZW4ubWVtb3J5LmhlYXBbIHVnZW4ubWVtb3J5LnZhbHVlLmlkeCBdID0gdWdlbi5tYXggXG4gICAgfVxuICB9XG5cbiAgdWdlbi5tZW1vcnkgPSB7XG4gICAgdmFsdWU6IHsgbGVuZ3RoOjEsIGlkeDpudWxsIH1cbiAgfVxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiA9IHJlcXVpcmUoICcuL2dlbi5qcycgKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidib29sJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSwgb3V0XG5cbiAgICBvdXQgPSBgJHtpbnB1dHNbMF19ID09PSAwID8gMCA6IDFgXG4gICAgXG4gICAgLy9nZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSBgZ2VuLmRhdGEuJHt0aGlzLm5hbWV9YFxuXG4gICAgLy9yZXR1cm4gWyBgZ2VuLmRhdGEuJHt0aGlzLm5hbWV9YCwgJyAnICtvdXQgXVxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW4xICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7IFxuICAgIHVpZDogICAgICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6ICAgICBbIGluMSBdLFxuICB9KVxuICBcbiAgdWdlbi5uYW1lID0gYCR7dWdlbi5iYXNlbmFtZX0ke3VnZW4udWlkfWBcblxuICByZXR1cm4gdWdlblxufVxuXG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgbmFtZTonY2VpbCcsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuXG4gICAgXG4gICAgY29uc3QgaXNXb3JrbGV0ID0gZ2VuLm1vZGUgPT09ICd3b3JrbGV0J1xuICAgIGNvbnN0IHJlZiA9IGlzV29ya2xldCA/ICcnIDogJ2dlbi4nXG5cbiAgICBpZiggaXNOYU4oIGlucHV0c1swXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7IFsgdGhpcy5uYW1lIF06IGlzV29ya2xldCA/ICdNYXRoLmNlaWwnIDogTWF0aC5jZWlsIH0pXG5cbiAgICAgIG91dCA9IGAke3JlZn1jZWlsKCAke2lucHV0c1swXX0gKWBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLmNlaWwoIHBhcnNlRmxvYXQoIGlucHV0c1swXSApIClcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geCA9PiB7XG4gIGxldCBjZWlsID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIGNlaWwuaW5wdXRzID0gWyB4IF1cblxuICByZXR1cm4gY2VpbFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKSxcbiAgICBmbG9vcj0gcmVxdWlyZSgnLi9mbG9vci5qcycpLFxuICAgIHN1YiAgPSByZXF1aXJlKCcuL3N1Yi5qcycpLFxuICAgIG1lbW8gPSByZXF1aXJlKCcuL21lbW8uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidjbGlwJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGNvZGUsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSxcbiAgICAgICAgb3V0XG5cbiAgICBvdXQgPVxuXG5gIHZhciAke3RoaXMubmFtZX0gPSAke2lucHV0c1swXX1cbiAgaWYoICR7dGhpcy5uYW1lfSA+ICR7aW5wdXRzWzJdfSApICR7dGhpcy5uYW1lfSA9ICR7aW5wdXRzWzJdfVxuICBlbHNlIGlmKCAke3RoaXMubmFtZX0gPCAke2lucHV0c1sxXX0gKSAke3RoaXMubmFtZX0gPSAke2lucHV0c1sxXX1cbmBcbiAgICBvdXQgPSAnICcgKyBvdXRcbiAgICBcbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWVcblxuICAgIHJldHVybiBbIHRoaXMubmFtZSwgb3V0IF1cbiAgfSxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIGluMSwgbWluPS0xLCBtYXg9MSApID0+IHtcbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwgeyBcbiAgICBtaW4sIFxuICAgIG1heCxcbiAgICB1aWQ6ICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6IFsgaW4xLCBtaW4sIG1heCBdLFxuICB9KVxuICBcbiAgdWdlbi5uYW1lID0gYCR7dWdlbi5iYXNlbmFtZX0ke3VnZW4udWlkfWBcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidjb3MnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcbiAgICBcbiAgICBcbiAgICBjb25zdCBpc1dvcmtsZXQgPSBnZW4ubW9kZSA9PT0gJ3dvcmtsZXQnXG5cbiAgICBjb25zdCByZWYgPSBpc1dvcmtsZXQgPyAnJyA6ICdnZW4uJ1xuXG4gICAgaWYoIGlzTmFOKCBpbnB1dHNbMF0gKSApIHtcbiAgICAgIGdlbi5jbG9zdXJlcy5hZGQoeyAnY29zJzogaXNXb3JrbGV0ID8gJ01hdGguY29zJyA6IE1hdGguY29zIH0pXG5cbiAgICAgIG91dCA9IGAke3JlZn1jb3MoICR7aW5wdXRzWzBdfSApYCBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLmNvcyggcGFyc2VGbG9hdCggaW5wdXRzWzBdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IGNvcyA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBjb3MuaW5wdXRzID0gWyB4IF1cbiAgY29zLmlkID0gZ2VuLmdldFVJRCgpXG4gIGNvcy5uYW1lID0gYCR7Y29zLmJhc2VuYW1lfXtjb3MuaWR9YFxuXG4gIHJldHVybiBjb3Ncbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonY291bnRlcicsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBjb2RlLFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksXG4gICAgICAgIGdlbk5hbWUgPSAnZ2VuLicgKyB0aGlzLm5hbWUsXG4gICAgICAgIGZ1bmN0aW9uQm9keVxuICAgICAgIFxuICAgIGlmKCB0aGlzLm1lbW9yeS52YWx1ZS5pZHggPT09IG51bGwgKSBnZW4ucmVxdWVzdE1lbW9yeSggdGhpcy5tZW1vcnkgKVxuICAgIGdlbi5tZW1vcnkuaGVhcFsgdGhpcy5tZW1vcnkudmFsdWUuaWR4IF0gPSB0aGlzLmluaXRpYWxWYWx1ZVxuICAgIFxuICAgIGZ1bmN0aW9uQm9keSAgPSB0aGlzLmNhbGxiYWNrKCBnZW5OYW1lLCBpbnB1dHNbMF0sIGlucHV0c1sxXSwgaW5wdXRzWzJdLCBpbnB1dHNbM10sIGlucHV0c1s0XSwgIGBtZW1vcnlbJHt0aGlzLm1lbW9yeS52YWx1ZS5pZHh9XWAsIGBtZW1vcnlbJHt0aGlzLm1lbW9yeS53cmFwLmlkeH1dYCAgKVxuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lICsgJ192YWx1ZSdcbiAgIFxuICAgIGlmKCBnZW4ubWVtb1sgdGhpcy53cmFwLm5hbWUgXSA9PT0gdW5kZWZpbmVkICkgdGhpcy53cmFwLmdlbigpXG5cbiAgICByZXR1cm4gWyB0aGlzLm5hbWUgKyAnX3ZhbHVlJywgZnVuY3Rpb25Cb2R5IF1cbiAgfSxcblxuICBjYWxsYmFjayggX25hbWUsIF9pbmNyLCBfbWluLCBfbWF4LCBfcmVzZXQsIGxvb3BzLCB2YWx1ZVJlZiwgd3JhcFJlZiApIHtcbiAgICBsZXQgZGlmZiA9IHRoaXMubWF4IC0gdGhpcy5taW4sXG4gICAgICAgIG91dCA9ICcnLFxuICAgICAgICB3cmFwID0gJydcbiAgICAvLyBtdXN0IGNoZWNrIGZvciByZXNldCBiZWZvcmUgc3RvcmluZyB2YWx1ZSBmb3Igb3V0cHV0XG4gICAgaWYoICEodHlwZW9mIHRoaXMuaW5wdXRzWzNdID09PSAnbnVtYmVyJyAmJiB0aGlzLmlucHV0c1szXSA8IDEpICkgeyBcbiAgICAgIG91dCArPSBgICBpZiggJHtfcmVzZXR9ID49IDEgKSAke3ZhbHVlUmVmfSA9ICR7X21pbn1cXG5gXG4gICAgfVxuXG4gICAgb3V0ICs9IGAgIHZhciAke3RoaXMubmFtZX1fdmFsdWUgPSAke3ZhbHVlUmVmfTtcXG4gICR7dmFsdWVSZWZ9ICs9ICR7X2luY3J9XFxuYCAvLyBzdG9yZSBvdXRwdXQgdmFsdWUgYmVmb3JlIGFjY3VtdWxhdGluZyAgXG4gICAgXG4gICAgaWYoIHR5cGVvZiB0aGlzLm1heCA9PT0gJ251bWJlcicgJiYgdGhpcy5tYXggIT09IEluZmluaXR5ICYmIHR5cGVvZiB0aGlzLm1pbiAhPT0gJ251bWJlcicgKSB7XG4gICAgICB3cmFwID0gXG5gICBpZiggJHt2YWx1ZVJlZn0gPj0gJHt0aGlzLm1heH0gJiYgICR7bG9vcHN9ID4gMCkge1xuICAgICR7dmFsdWVSZWZ9IC09ICR7ZGlmZn1cbiAgICAke3dyYXBSZWZ9ID0gMVxuICB9ZWxzZXtcbiAgICAke3dyYXBSZWZ9ID0gMFxuICB9XFxuYFxuICAgIH1lbHNlIGlmKCB0aGlzLm1heCAhPT0gSW5maW5pdHkgJiYgdGhpcy5taW4gIT09IEluZmluaXR5ICkge1xuICAgICAgd3JhcCA9IFxuYCAgaWYoICR7dmFsdWVSZWZ9ID49ICR7X21heH0gJiYgICR7bG9vcHN9ID4gMCkge1xuICAgICR7dmFsdWVSZWZ9IC09ICR7X21heH0gLSAke19taW59XG4gICAgJHt3cmFwUmVmfSA9IDFcbiAgfWVsc2UgaWYoICR7dmFsdWVSZWZ9IDwgJHtfbWlufSAmJiAgJHtsb29wc30gPiAwKSB7XG4gICAgJHt2YWx1ZVJlZn0gKz0gJHtfbWF4fSAtICR7X21pbn1cbiAgICAke3dyYXBSZWZ9ID0gMVxuICB9ZWxzZXtcbiAgICAke3dyYXBSZWZ9ID0gMFxuICB9XFxuYFxuICAgIH1lbHNle1xuICAgICAgb3V0ICs9ICdcXG4nXG4gICAgfVxuXG4gICAgb3V0ID0gb3V0ICsgd3JhcFxuXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCBpbmNyPTEsIG1pbj0wLCBtYXg9SW5maW5pdHksIHJlc2V0PTAsIGxvb3BzPTEsICBwcm9wZXJ0aWVzICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvICksXG4gICAgICBkZWZhdWx0cyA9IE9iamVjdC5hc3NpZ24oIHsgaW5pdGlhbFZhbHVlOiAwLCBzaG91bGRXcmFwOnRydWUgfSwgcHJvcGVydGllcyApXG5cbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwgeyBcbiAgICBtaW46ICAgIG1pbiwgXG4gICAgbWF4OiAgICBtYXgsXG4gICAgaW5pdGlhbFZhbHVlOiBkZWZhdWx0cy5pbml0aWFsVmFsdWUsXG4gICAgdmFsdWU6ICBkZWZhdWx0cy5pbml0aWFsVmFsdWUsXG4gICAgdWlkOiAgICBnZW4uZ2V0VUlEKCksXG4gICAgaW5wdXRzOiBbIGluY3IsIG1pbiwgbWF4LCByZXNldCwgbG9vcHMgXSxcbiAgICBtZW1vcnk6IHtcbiAgICAgIHZhbHVlOiB7IGxlbmd0aDoxLCBpZHg6IG51bGwgfSxcbiAgICAgIHdyYXA6ICB7IGxlbmd0aDoxLCBpZHg6IG51bGwgfSBcbiAgICB9LFxuICAgIHdyYXAgOiB7XG4gICAgICBnZW4oKSB7IFxuICAgICAgICBpZiggdWdlbi5tZW1vcnkud3JhcC5pZHggPT09IG51bGwgKSB7XG4gICAgICAgICAgZ2VuLnJlcXVlc3RNZW1vcnkoIHVnZW4ubWVtb3J5IClcbiAgICAgICAgfVxuICAgICAgICBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcbiAgICAgICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gYG1lbW9yeVsgJHt1Z2VuLm1lbW9yeS53cmFwLmlkeH0gXWBcbiAgICAgICAgcmV0dXJuIGBtZW1vcnlbICR7dWdlbi5tZW1vcnkud3JhcC5pZHh9IF1gIFxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZGVmYXVsdHMgKVxuIFxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHVnZW4sICd2YWx1ZScsIHtcbiAgICBnZXQoKSB7XG4gICAgICBpZiggdGhpcy5tZW1vcnkudmFsdWUuaWR4ICE9PSBudWxsICkge1xuICAgICAgICByZXR1cm4gZ2VuLm1lbW9yeS5oZWFwWyB0aGlzLm1lbW9yeS52YWx1ZS5pZHggXVxuICAgICAgfVxuICAgIH0sXG4gICAgc2V0KCB2ICkge1xuICAgICAgaWYoIHRoaXMubWVtb3J5LnZhbHVlLmlkeCAhPT0gbnVsbCApIHtcbiAgICAgICAgZ2VuLm1lbW9yeS5oZWFwWyB0aGlzLm1lbW9yeS52YWx1ZS5pZHggXSA9IHYgXG4gICAgICB9XG4gICAgfVxuICB9KVxuICBcbiAgdWdlbi53cmFwLmlucHV0cyA9IFsgdWdlbiBdXG4gIHVnZW4ubmFtZSA9IGAke3VnZW4uYmFzZW5hbWV9JHt1Z2VuLnVpZH1gXG4gIHVnZW4ud3JhcC5uYW1lID0gdWdlbi5uYW1lICsgJ193cmFwJ1xuICByZXR1cm4gdWdlblxufSBcbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoICcuL2dlbi5qcycgKSxcbiAgICBhY2N1bT0gcmVxdWlyZSggJy4vcGhhc29yLmpzJyApLFxuICAgIGRhdGEgPSByZXF1aXJlKCAnLi9kYXRhLmpzJyApLFxuICAgIHBlZWsgPSByZXF1aXJlKCAnLi9wZWVrLmpzJyApLFxuICAgIG11bCAgPSByZXF1aXJlKCAnLi9tdWwuanMnICksXG4gICAgcGhhc29yPXJlcXVpcmUoICcuL3BoYXNvci5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2N5Y2xlJyxcblxuICBpbml0VGFibGUoKSB7ICAgIFxuICAgIGxldCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KCAxMDI0IClcblxuICAgIGZvciggbGV0IGkgPSAwLCBsID0gYnVmZmVyLmxlbmd0aDsgaSA8IGw7IGkrKyApIHtcbiAgICAgIGJ1ZmZlclsgaSBdID0gTWF0aC5zaW4oICggaSAvIGwgKSAqICggTWF0aC5QSSAqIDIgKSApXG4gICAgfVxuXG4gICAgZ2VuLmdsb2JhbHMuY3ljbGUgPSBkYXRhKCBidWZmZXIsIDEsIHsgaW1tdXRhYmxlOnRydWUgfSApXG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggZnJlcXVlbmN5PTEsIHJlc2V0PTAsIF9wcm9wcyApID0+IHtcbiAgaWYoIHR5cGVvZiBnZW4uZ2xvYmFscy5jeWNsZSA9PT0gJ3VuZGVmaW5lZCcgKSBwcm90by5pbml0VGFibGUoKSBcbiAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCB7IG1pbjowIH0sIF9wcm9wcyApXG5cbiAgY29uc3QgdWdlbiA9IHBlZWsoIGdlbi5nbG9iYWxzLmN5Y2xlLCBwaGFzb3IoIGZyZXF1ZW5jeSwgcmVzZXQsIHByb3BzICkpXG4gIHVnZW4ubmFtZSA9ICdjeWNsZScgKyBnZW4uZ2V0VUlEKClcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpLFxuICAgICAgdXRpbGl0aWVzID0gcmVxdWlyZSggJy4vdXRpbGl0aWVzLmpzJyApLFxuICAgICAgcGVlayA9IHJlcXVpcmUoJy4vcGVlay5qcycpLFxuICAgICAgcG9rZSA9IHJlcXVpcmUoJy4vcG9rZS5qcycpXG5cbmNvbnN0IHByb3RvID0ge1xuICBiYXNlbmFtZTonZGF0YScsXG4gIGdsb2JhbHM6IHt9LFxuICBtZW1vOnt9LFxuXG4gIGdlbigpIHtcbiAgICBsZXQgaWR4XG4gICAgLy9jb25zb2xlLmxvZyggJ2RhdGEgbmFtZTonLCB0aGlzLm5hbWUsIHByb3RvLm1lbW8gKVxuICAgIC8vZGVidWdnZXJcbiAgICBpZiggZ2VuLm1lbW9bIHRoaXMubmFtZSBdID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBsZXQgdWdlbiA9IHRoaXNcbiAgICAgIGdlbi5yZXF1ZXN0TWVtb3J5KCB0aGlzLm1lbW9yeSwgdGhpcy5pbW11dGFibGUgKSBcbiAgICAgIGlkeCA9IHRoaXMubWVtb3J5LnZhbHVlcy5pZHhcbiAgICAgIGlmKCB0aGlzLmJ1ZmZlciAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGdlbi5tZW1vcnkuaGVhcC5zZXQoIHRoaXMuYnVmZmVyLCBpZHggKVxuICAgICAgICB9Y2F0Y2goIGUgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coIGUgKVxuICAgICAgICAgIHRocm93IEVycm9yKCAnZXJyb3Igd2l0aCByZXF1ZXN0LiBhc2tpbmcgZm9yICcgKyB0aGlzLmJ1ZmZlci5sZW5ndGggKycuIGN1cnJlbnQgaW5kZXg6ICcgKyBnZW4ubWVtb3J5SW5kZXggKyAnIG9mICcgKyBnZW4ubWVtb3J5LmhlYXAubGVuZ3RoIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy9nZW4uZGF0YVsgdGhpcy5uYW1lIF0gPSB0aGlzXG4gICAgICAvL3JldHVybiAnZ2VuLm1lbW9yeScgKyB0aGlzLm5hbWUgKyAnLmJ1ZmZlcidcbiAgICAgIGlmKCB0aGlzLm5hbWUuaW5kZXhPZignZGF0YScpID09PSAtMSApIHtcbiAgICAgICAgcHJvdG8ubWVtb1sgdGhpcy5uYW1lIF0gPSBpZHhcbiAgICAgIH1lbHNle1xuICAgICAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSBpZHhcbiAgICAgIH1cbiAgICB9ZWxzZXtcbiAgICAgIC8vY29uc29sZS5sb2coICd1c2luZyBnZW4gZGF0YSBtZW1vJywgcHJvdG8ubWVtb1sgdGhpcy5uYW1lIF0gKVxuICAgICAgaWR4ID0gZ2VuLm1lbW9bIHRoaXMubmFtZSBdXG4gICAgfVxuICAgIHJldHVybiBpZHhcbiAgfSxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIHgsIHk9MSwgcHJvcGVydGllcyApID0+IHtcbiAgbGV0IHVnZW4sIGJ1ZmZlciwgc2hvdWxkTG9hZCA9IGZhbHNlXG4gIFxuICBpZiggcHJvcGVydGllcyAhPT0gdW5kZWZpbmVkICYmIHByb3BlcnRpZXMuZ2xvYmFsICE9PSB1bmRlZmluZWQgKSB7XG4gICAgaWYoIGdlbi5nbG9iYWxzWyBwcm9wZXJ0aWVzLmdsb2JhbCBdICkge1xuICAgICAgcmV0dXJuIGdlbi5nbG9iYWxzWyBwcm9wZXJ0aWVzLmdsb2JhbCBdXG4gICAgfVxuICB9XG5cbiAgaWYoIHR5cGVvZiB4ID09PSAnbnVtYmVyJyApIHtcbiAgICBpZiggeSAhPT0gMSApIHtcbiAgICAgIGJ1ZmZlciA9IFtdXG4gICAgICBmb3IoIGxldCBpID0gMDsgaSA8IHk7IGkrKyApIHtcbiAgICAgICAgYnVmZmVyWyBpIF0gPSBuZXcgRmxvYXQzMkFycmF5KCB4IClcbiAgICAgIH1cbiAgICB9ZWxzZXtcbiAgICAgIGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkoIHggKVxuICAgIH1cbiAgfWVsc2UgaWYoIEFycmF5LmlzQXJyYXkoIHggKSApIHsgLy8hICh4IGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkgKSB7XG4gICAgbGV0IHNpemUgPSB4Lmxlbmd0aFxuICAgIGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkoIHNpemUgKVxuICAgIGZvciggbGV0IGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkrKyApIHtcbiAgICAgIGJ1ZmZlclsgaSBdID0geFsgaSBdXG4gICAgfVxuICB9ZWxzZSBpZiggdHlwZW9mIHggPT09ICdzdHJpbmcnICkge1xuICAgIC8vYnVmZmVyID0geyBsZW5ndGg6IHkgPiAxID8geSA6IGdlbi5zYW1wbGVyYXRlICogNjAgfSAvLyBYWFggd2hhdD8/P1xuICAgIC8vaWYoIHByb3RvLm1lbW9bIHggXSA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgYnVmZmVyID0geyBsZW5ndGg6IHkgPiAxID8geSA6IDEgfSAvLyBYWFggd2hhdD8/P1xuICAgICAgc2hvdWxkTG9hZCA9IHRydWVcbiAgICAvL31lbHNle1xuICAgICAgLy9idWZmZXIgPSBwcm90by5tZW1vWyB4IF1cbiAgICAvL31cbiAgfWVsc2UgaWYoIHggaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgKSB7XG4gICAgYnVmZmVyID0geFxuICB9XG4gIFxuICB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKSBcblxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCBcbiAgeyBcbiAgICBidWZmZXIsXG4gICAgbmFtZTogcHJvdG8uYmFzZW5hbWUgKyBnZW4uZ2V0VUlEKCksXG4gICAgZGltOiAgYnVmZmVyICE9PSB1bmRlZmluZWQgPyBidWZmZXIubGVuZ3RoIDogMSwgLy8gWFhYIGhvdyBkbyB3ZSBkeW5hbWljYWxseSBhbGxvY2F0ZSB0aGlzP1xuICAgIGNoYW5uZWxzIDogMSxcbiAgICBvbmxvYWQ6IG51bGwsXG4gICAgLy90aGVuKCBmbmMgKSB7XG4gICAgLy8gIHVnZW4ub25sb2FkID0gZm5jXG4gICAgLy8gIHJldHVybiB1Z2VuXG4gICAgLy99LFxuICAgIGltbXV0YWJsZTogcHJvcGVydGllcyAhPT0gdW5kZWZpbmVkICYmIHByb3BlcnRpZXMuaW1tdXRhYmxlID09PSB0cnVlID8gdHJ1ZSA6IGZhbHNlLFxuICAgIGxvYWQoIGZpbGVuYW1lLCBfX3Jlc29sdmUgKSB7XG4gICAgICBsZXQgcHJvbWlzZSA9IHV0aWxpdGllcy5sb2FkU2FtcGxlKCBmaWxlbmFtZSwgdWdlbiApXG4gICAgICBwcm9taXNlLnRoZW4oIF9idWZmZXIgPT4geyBcbiAgICAgICAgcHJvdG8ubWVtb1sgeCBdID0gX2J1ZmZlclxuICAgICAgICB1Z2VuLm5hbWUgPSBmaWxlbmFtZVxuICAgICAgICB1Z2VuLm1lbW9yeS52YWx1ZXMubGVuZ3RoID0gdWdlbi5kaW0gPSBfYnVmZmVyLmxlbmd0aFxuXG4gICAgICAgIGdlbi5yZXF1ZXN0TWVtb3J5KCB1Z2VuLm1lbW9yeSwgdWdlbi5pbW11dGFibGUgKSBcbiAgICAgICAgZ2VuLm1lbW9yeS5oZWFwLnNldCggX2J1ZmZlciwgdWdlbi5tZW1vcnkudmFsdWVzLmlkeCApXG4gICAgICAgIGlmKCB0eXBlb2YgdWdlbi5vbmxvYWQgPT09ICdmdW5jdGlvbicgKSB1Z2VuLm9ubG9hZCggX2J1ZmZlciApIFxuICAgICAgICBfX3Jlc29sdmUoIHVnZW4gKVxuICAgICAgfSlcbiAgICB9LFxuICAgIG1lbW9yeSA6IHtcbiAgICAgIHZhbHVlczogeyBsZW5ndGg6YnVmZmVyICE9PSB1bmRlZmluZWQgPyBidWZmZXIubGVuZ3RoIDogMSwgaWR4Om51bGwgfVxuICAgIH1cbiAgfSxcbiAgcHJvcGVydGllc1xuICApXG5cbiAgXG4gIGlmKCBwcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQgKSB7XG4gICAgaWYoIHByb3BlcnRpZXMuZ2xvYmFsICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICBnZW4uZ2xvYmFsc1sgcHJvcGVydGllcy5nbG9iYWwgXSA9IHVnZW5cbiAgICB9XG4gICAgaWYoIHByb3BlcnRpZXMubWV0YSA9PT0gdHJ1ZSApIHtcbiAgICAgIGZvciggbGV0IGkgPSAwLCBsZW5ndGggPSB1Z2VuLmJ1ZmZlci5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKyApIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCB1Z2VuLCBpLCB7XG4gICAgICAgICAgZ2V0ICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwZWVrKCB1Z2VuLCBpLCB7IG1vZGU6J3NpbXBsZScsIGludGVycDonbm9uZScgfSApXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXQoIHYgKSB7XG4gICAgICAgICAgICByZXR1cm4gcG9rZSggdWdlbiwgdiwgaSApXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCByZXR1cm5WYWx1ZVxuICBpZiggc2hvdWxkTG9hZCA9PT0gdHJ1ZSApIHtcbiAgICByZXR1cm5WYWx1ZSA9IG5ldyBQcm9taXNlKCAocmVzb2x2ZSxyZWplY3QpID0+IHtcbiAgICAgIC8vdWdlbi5sb2FkKCB4LCByZXNvbHZlIClcbiAgICAgIGxldCBwcm9taXNlID0gdXRpbGl0aWVzLmxvYWRTYW1wbGUoIHgsIHVnZW4gKVxuICAgICAgcHJvbWlzZS50aGVuKCBfYnVmZmVyID0+IHsgXG4gICAgICAgIHByb3RvLm1lbW9bIHggXSA9IF9idWZmZXJcbiAgICAgICAgdWdlbi5tZW1vcnkudmFsdWVzLmxlbmd0aCA9IHVnZW4uZGltID0gX2J1ZmZlci5sZW5ndGhcblxuICAgICAgICB1Z2VuLmJ1ZmZlciA9IF9idWZmZXJcbiAgICAgICAgLy9nZW4ub25jZSggJ21lbW9yeSBpbml0JywgKCk9PiB7XG4gICAgICAgIC8vICBjb25zb2xlLmxvZyggXCJDQUxMRURcIiwgdWdlbi5tZW1vcnkgKVxuICAgICAgICAvLyAgZ2VuLnJlcXVlc3RNZW1vcnkoIHVnZW4ubWVtb3J5LCB1Z2VuLmltbXV0YWJsZSApIFxuICAgICAgICAvLyAgZ2VuLm1lbW9yeS5oZWFwLnNldCggX2J1ZmZlciwgdWdlbi5tZW1vcnkudmFsdWVzLmlkeCApXG4gICAgICAgIC8vICBpZiggdHlwZW9mIHVnZW4ub25sb2FkID09PSAnZnVuY3Rpb24nICkgdWdlbi5vbmxvYWQoIF9idWZmZXIgKSBcbiAgICAgICAgLy99KVxuICAgICAgICBcbiAgICAgICAgcmVzb2x2ZSggdWdlbiApXG4gICAgICB9KSAgICAgXG4gICAgfSlcbiAgfWVsc2UgaWYoIHByb3RvLm1lbW9bIHggXSAhPT0gdW5kZWZpbmVkICkge1xuXG4gICAgZ2VuLm9uY2UoICdtZW1vcnkgaW5pdCcsICgpPT4ge1xuICAgICAgZ2VuLnJlcXVlc3RNZW1vcnkoIHVnZW4ubWVtb3J5LCB1Z2VuLmltbXV0YWJsZSApIFxuICAgICAgZ2VuLm1lbW9yeS5oZWFwLnNldCggdWdlbi5idWZmZXIsIHVnZW4ubWVtb3J5LnZhbHVlcy5pZHggKVxuICAgICAgaWYoIHR5cGVvZiB1Z2VuLm9ubG9hZCA9PT0gJ2Z1bmN0aW9uJyApIHVnZW4ub25sb2FkKCB1Z2VuLmJ1ZmZlciApIFxuICAgIH0pXG5cbiAgICByZXR1cm5WYWx1ZSA9IHVnZW5cbiAgfWVsc2V7XG4gICAgcmV0dXJuVmFsdWUgPSB1Z2VuXG4gIH1cblxuICByZXR1cm4gcmV0dXJuVmFsdWUgXG59XG5cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICAgICA9IHJlcXVpcmUoICcuL2dlbi5qcycgKSxcbiAgICBoaXN0b3J5ID0gcmVxdWlyZSggJy4vaGlzdG9yeS5qcycgKSxcbiAgICBzdWIgICAgID0gcmVxdWlyZSggJy4vc3ViLmpzJyApLFxuICAgIGFkZCAgICAgPSByZXF1aXJlKCAnLi9hZGQuanMnICksXG4gICAgbXVsICAgICA9IHJlcXVpcmUoICcuL211bC5qcycgKSxcbiAgICBtZW1vICAgID0gcmVxdWlyZSggJy4vbWVtby5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW4xICkgPT4ge1xuICBsZXQgeDEgPSBoaXN0b3J5KCksXG4gICAgICB5MSA9IGhpc3RvcnkoKSxcbiAgICAgIGZpbHRlclxuXG4gIC8vSGlzdG9yeSB4MSwgeTE7IHkgPSBpbjEgLSB4MSArIHkxKjAuOTk5NzsgeDEgPSBpbjE7IHkxID0geTsgb3V0MSA9IHk7XG4gIGZpbHRlciA9IG1lbW8oIGFkZCggc3ViKCBpbjEsIHgxLm91dCApLCBtdWwoIHkxLm91dCwgLjk5OTcgKSApIClcbiAgeDEuaW4oIGluMSApXG4gIHkxLmluKCBmaWx0ZXIgKVxuXG4gIHJldHVybiBmaWx0ZXJcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICAgICA9IHJlcXVpcmUoICcuL2dlbi5qcycgKSxcbiAgICBoaXN0b3J5ID0gcmVxdWlyZSggJy4vaGlzdG9yeS5qcycgKSxcbiAgICBtdWwgICAgID0gcmVxdWlyZSggJy4vbXVsLmpzJyApLFxuICAgIHQ2MCAgICAgPSByZXF1aXJlKCAnLi90NjAuanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSAoIGRlY2F5VGltZSA9IDQ0MTAwLCBwcm9wcyApID0+IHtcbiAgbGV0IHByb3BlcnRpZXMgPSBPYmplY3QuYXNzaWduKHt9LCB7IGluaXRWYWx1ZToxIH0sIHByb3BzICksXG4gICAgICBzc2QgPSBoaXN0b3J5ICggcHJvcGVydGllcy5pbml0VmFsdWUgKVxuXG4gIHNzZC5pbiggbXVsKCBzc2Qub3V0LCB0NjAoIGRlY2F5VGltZSApICkgKVxuXG4gIHNzZC5vdXQudHJpZ2dlciA9ICgpPT4ge1xuICAgIHNzZC52YWx1ZSA9IDFcbiAgfVxuXG4gIHJldHVybiBzc2Qub3V0IFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGdlbiAgPSByZXF1aXJlKCAnLi9nZW4uanMnICApLFxuICAgICAgZGF0YSA9IHJlcXVpcmUoICcuL2RhdGEuanMnICksXG4gICAgICBwb2tlID0gcmVxdWlyZSggJy4vcG9rZS5qcycgKSxcbiAgICAgIHBlZWsgPSByZXF1aXJlKCAnLi9wZWVrLmpzJyApLFxuICAgICAgc3ViICA9IHJlcXVpcmUoICcuL3N1Yi5qcycgICksXG4gICAgICB3cmFwID0gcmVxdWlyZSggJy4vd3JhcC5qcycgKSxcbiAgICAgIGFjY3VtPSByZXF1aXJlKCAnLi9hY2N1bS5qcycpLFxuICAgICAgbWVtbyA9IHJlcXVpcmUoICcuL21lbW8uanMnIClcblxuY29uc3QgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidkZWxheScsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcbiAgICBcbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSBpbnB1dHNbMF1cbiAgICBcbiAgICByZXR1cm4gaW5wdXRzWzBdXG4gIH0sXG59XG5cbmNvbnN0IGRlZmF1bHRzID0geyBzaXplOiA1MTIsIGludGVycDonbm9uZScgfVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW4xLCB0YXBzLCBwcm9wZXJ0aWVzICkgPT4ge1xuICBjb25zdCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuICBsZXQgd3JpdGVJZHgsIHJlYWRJZHgsIGRlbGF5ZGF0YVxuXG4gIGlmKCBBcnJheS5pc0FycmF5KCB0YXBzICkgPT09IGZhbHNlICkgdGFwcyA9IFsgdGFwcyBdXG4gIFxuICBjb25zdCBwcm9wcyA9IE9iamVjdC5hc3NpZ24oIHt9LCBkZWZhdWx0cywgcHJvcGVydGllcyApXG5cbiAgY29uc3QgbWF4VGFwU2l6ZSA9IE1hdGgubWF4KCAuLi50YXBzIClcbiAgaWYoIHByb3BzLnNpemUgPCBtYXhUYXBTaXplICkgcHJvcHMuc2l6ZSA9IG1heFRhcFNpemVcblxuICBkZWxheWRhdGEgPSBkYXRhKCBwcm9wcy5zaXplIClcbiAgXG4gIHVnZW4uaW5wdXRzID0gW11cblxuICB3cml0ZUlkeCA9IGFjY3VtKCAxLCAwLCB7IG1heDpwcm9wcy5zaXplLCBtaW46MCB9KVxuICBcbiAgZm9yKCBsZXQgaSA9IDA7IGkgPCB0YXBzLmxlbmd0aDsgaSsrICkge1xuICAgIHVnZW4uaW5wdXRzWyBpIF0gPSBwZWVrKCBkZWxheWRhdGEsIHdyYXAoIHN1Yiggd3JpdGVJZHgsIHRhcHNbaV0gKSwgMCwgcHJvcHMuc2l6ZSApLHsgbW9kZTonc2FtcGxlcycsIGludGVycDpwcm9wcy5pbnRlcnAgfSlcbiAgfVxuICBcbiAgdWdlbi5vdXRwdXRzID0gdWdlbi5pbnB1dHMgLy8gWFhYIHVnaCwgVWdoLCBVR0ghIGJ1dCBpIGd1ZXNzIGl0IHdvcmtzLlxuXG4gIHBva2UoIGRlbGF5ZGF0YSwgaW4xLCB3cml0ZUlkeCApXG5cbiAgdWdlbi5uYW1lID0gYCR7dWdlbi5iYXNlbmFtZX0ke2dlbi5nZXRVSUQoKX1gXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICAgICA9IHJlcXVpcmUoICcuL2dlbi5qcycgKSxcbiAgICBoaXN0b3J5ID0gcmVxdWlyZSggJy4vaGlzdG9yeS5qcycgKSxcbiAgICBzdWIgICAgID0gcmVxdWlyZSggJy4vc3ViLmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gKCBpbjEgKSA9PiB7XG4gIGxldCBuMSA9IGhpc3RvcnkoKVxuICAgIFxuICBuMS5pbiggaW4xIClcblxuICBsZXQgdWdlbiA9IHN1YiggaW4xLCBuMS5vdXQgKVxuICB1Z2VuLm5hbWUgPSAnZGVsdGEnK2dlbi5nZXRVSUQoKVxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxuY29uc3QgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidkaXYnLFxuICBnZW4oKSB7XG4gICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSxcbiAgICAgICAgb3V0PWAgIHZhciAke3RoaXMubmFtZX0gPSBgLFxuICAgICAgICBkaWZmID0gMCwgXG4gICAgICAgIG51bUNvdW50ID0gMCxcbiAgICAgICAgbGFzdE51bWJlciA9IGlucHV0c1sgMCBdLFxuICAgICAgICBsYXN0TnVtYmVySXNVZ2VuID0gaXNOYU4oIGxhc3ROdW1iZXIgKSwgXG4gICAgICAgIGRpdkF0RW5kID0gZmFsc2VcblxuICAgIGlucHV0cy5mb3JFYWNoKCAodixpKSA9PiB7XG4gICAgICBpZiggaSA9PT0gMCApIHJldHVyblxuXG4gICAgICBsZXQgaXNOdW1iZXJVZ2VuID0gaXNOYU4oIHYgKSxcbiAgICAgICAgaXNGaW5hbElkeCAgID0gaSA9PT0gaW5wdXRzLmxlbmd0aCAtIDFcblxuICAgICAgaWYoICFsYXN0TnVtYmVySXNVZ2VuICYmICFpc051bWJlclVnZW4gKSB7XG4gICAgICAgIGxhc3ROdW1iZXIgPSBsYXN0TnVtYmVyIC8gdlxuICAgICAgICBvdXQgKz0gbGFzdE51bWJlclxuICAgICAgfWVsc2V7XG4gICAgICAgIG91dCArPSBgJHtsYXN0TnVtYmVyfSAvICR7dn1gXG4gICAgICB9XG5cbiAgICAgIGlmKCAhaXNGaW5hbElkeCApIG91dCArPSAnIC8gJyBcbiAgICB9KVxuXG4gICAgb3V0ICs9ICdcXG4nXG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWVcblxuICAgIHJldHVybiBbIHRoaXMubmFtZSwgb3V0IF1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICguLi5hcmdzKSA9PiB7XG4gIGNvbnN0IGRpdiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcbiAgXG4gIE9iamVjdC5hc3NpZ24oIGRpdiwge1xuICAgIGlkOiAgICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogYXJncyxcbiAgfSlcblxuICBkaXYubmFtZSA9IGRpdi5iYXNlbmFtZSArIGRpdi5pZFxuICBcbiAgcmV0dXJuIGRpdlxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gICAgID0gcmVxdWlyZSggJy4vZ2VuJyApLFxuICAgIHdpbmRvd3MgPSByZXF1aXJlKCAnLi93aW5kb3dzJyApLFxuICAgIGRhdGEgICAgPSByZXF1aXJlKCAnLi9kYXRhJyApLFxuICAgIHBlZWsgICAgPSByZXF1aXJlKCAnLi9wZWVrJyApLFxuICAgIHBoYXNvciAgPSByZXF1aXJlKCAnLi9waGFzb3InICksXG4gICAgZGVmYXVsdHMgPSB7XG4gICAgICB0eXBlOid0cmlhbmd1bGFyJywgbGVuZ3RoOjEwMjQsIGFscGhhOi4xNSwgc2hpZnQ6MCwgcmV2ZXJzZTpmYWxzZSBcbiAgICB9XG5cbm1vZHVsZS5leHBvcnRzID0gcHJvcHMgPT4ge1xuICBcbiAgbGV0IHByb3BlcnRpZXMgPSBPYmplY3QuYXNzaWduKCB7fSwgZGVmYXVsdHMsIHByb3BzIClcbiAgbGV0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkoIHByb3BlcnRpZXMubGVuZ3RoIClcblxuICBsZXQgbmFtZSA9IHByb3BlcnRpZXMudHlwZSArICdfJyArIHByb3BlcnRpZXMubGVuZ3RoICsgJ18nICsgcHJvcGVydGllcy5zaGlmdCArICdfJyArIHByb3BlcnRpZXMucmV2ZXJzZSArICdfJyArIHByb3BlcnRpZXMuYWxwaGFcbiAgaWYoIHR5cGVvZiBnZW4uZ2xvYmFscy53aW5kb3dzWyBuYW1lIF0gPT09ICd1bmRlZmluZWQnICkgeyBcblxuICAgIGZvciggbGV0IGkgPSAwOyBpIDwgcHJvcGVydGllcy5sZW5ndGg7IGkrKyApIHtcbiAgICAgIGJ1ZmZlclsgaSBdID0gd2luZG93c1sgcHJvcGVydGllcy50eXBlIF0oIHByb3BlcnRpZXMubGVuZ3RoLCBpLCBwcm9wZXJ0aWVzLmFscGhhLCBwcm9wZXJ0aWVzLnNoaWZ0IClcbiAgICB9XG5cbiAgICBpZiggcHJvcGVydGllcy5yZXZlcnNlID09PSB0cnVlICkgeyBcbiAgICAgIGJ1ZmZlci5yZXZlcnNlKClcbiAgICB9XG4gICAgZ2VuLmdsb2JhbHMud2luZG93c1sgbmFtZSBdID0gZGF0YSggYnVmZmVyIClcbiAgfVxuXG4gIGxldCB1Z2VuID0gZ2VuLmdsb2JhbHMud2luZG93c1sgbmFtZSBdIFxuICB1Z2VuLm5hbWUgPSAnZW52JyArIGdlbi5nZXRVSUQoKVxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiA9IHJlcXVpcmUoICcuL2dlbi5qcycgKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidlcScsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksIG91dFxuXG4gICAgb3V0ID0gdGhpcy5pbnB1dHNbMF0gPT09IHRoaXMuaW5wdXRzWzFdID8gMSA6IGAgIHZhciAke3RoaXMubmFtZX0gPSAoJHtpbnB1dHNbMF19ID09PSAke2lucHV0c1sxXX0pIHwgMFxcblxcbmBcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IGAke3RoaXMubmFtZX1gXG5cbiAgICByZXR1cm4gWyBgJHt0aGlzLm5hbWV9YCwgb3V0IF1cbiAgfSxcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW4xLCBpbjIgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7XG4gICAgdWlkOiAgICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogIFsgaW4xLCBpbjIgXSxcbiAgfSlcbiAgXG4gIHVnZW4ubmFtZSA9IGAke3VnZW4uYmFzZW5hbWV9JHt1Z2VuLnVpZH1gXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBuYW1lOidleHAnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIFxuICAgIGNvbnN0IGlzV29ya2xldCA9IGdlbi5tb2RlID09PSAnd29ya2xldCdcbiAgICBjb25zdCByZWYgPSBpc1dvcmtsZXQ/ICcnIDogJ2dlbi4nXG5cbiAgICBpZiggaXNOYU4oIGlucHV0c1swXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7IFsgdGhpcy5uYW1lIF06IGlzV29ya2xldCA/ICdNYXRoLmV4cCcgOiBNYXRoLmV4cCB9KVxuXG4gICAgICBvdXQgPSBgJHtyZWZ9ZXhwKCAke2lucHV0c1swXX0gKWBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLmV4cCggcGFyc2VGbG9hdCggaW5wdXRzWzBdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IGV4cCA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBleHAuaW5wdXRzID0gWyB4IF1cblxuICByZXR1cm4gZXhwXG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDE4IEdvb2dsZSBMTENcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdFxuICogdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2ZcbiAqIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVFxuICogV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiBTZWUgdGhlXG4gKiBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9ucyB1bmRlclxuICogdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gb3JpZ2luYWxseSBmcm9tOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL0dvb2dsZUNocm9tZUxhYnMvYXVkaW93b3JrbGV0LXBvbHlmaWxsXG4vLyBJIGFtIG1vZGlmeWluZyBpdCB0byBhY2NlcHQgdmFyaWFibGUgYnVmZmVyIHNpemVzXG4vLyBhbmQgdG8gZ2V0IHJpZCBvZiBzb21lIHN0cmFuZ2UgZ2xvYmFsIGluaXRpYWxpemF0aW9uIHRoYXQgc2VlbXMgcmVxdWlyZWQgdG8gdXNlIGl0XG4vLyB3aXRoIGJyb3dzZXJpZnkuIEFsc28sIEkgYWRkZWQgY2hhbmdlcyB0byBmaXggYSBidWcgaW4gU2FmYXJpIGZvciB0aGUgQXVkaW9Xb3JrbGV0UHJvY2Vzc29yXG4vLyBwcm9wZXJ0eSBub3QgaGF2aW5nIGEgcHJvdG90eXBlIChzZWU6aHR0cHM6Ly9naXRodWIuY29tL0dvb2dsZUNocm9tZUxhYnMvYXVkaW93b3JrbGV0LXBvbHlmaWxsL3B1bGwvMjUpXG4vLyBUT0RPOiBXaHkgaXMgdGhlcmUgYW4gaWZyYW1lIGludm9sdmVkPyAocmVhbG0uanMpXG5cbmNvbnN0IFJlYWxtID0gcmVxdWlyZSggJy4vcmVhbG0uanMnIClcblxuY29uc3QgQVdQRiA9IGZ1bmN0aW9uKCBzZWxmID0gd2luZG93LCBidWZmZXJTaXplID0gNDA5NiApIHtcbiAgY29uc3QgUEFSQU1TID0gW11cbiAgbGV0IG5leHRQb3J0XG5cbiAgaWYgKHR5cGVvZiBBdWRpb1dvcmtsZXROb2RlICE9PSAnZnVuY3Rpb24nIHx8ICEoXCJhdWRpb1dvcmtsZXRcIiBpbiBBdWRpb0NvbnRleHQucHJvdG90eXBlKSkge1xuICAgIHNlbGYuQXVkaW9Xb3JrbGV0Tm9kZSA9IGZ1bmN0aW9uIEF1ZGlvV29ya2xldE5vZGUgKGNvbnRleHQsIG5hbWUsIG9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IHByb2Nlc3NvciA9IGdldFByb2Nlc3NvcnNGb3JDb250ZXh0KGNvbnRleHQpW25hbWVdO1xuICAgICAgY29uc3Qgb3V0cHV0Q2hhbm5lbHMgPSBvcHRpb25zICYmIG9wdGlvbnMub3V0cHV0Q2hhbm5lbENvdW50ID8gb3B0aW9ucy5vdXRwdXRDaGFubmVsQ291bnRbMF0gOiAyO1xuICAgICAgY29uc3Qgc2NyaXB0UHJvY2Vzc29yID0gY29udGV4dC5jcmVhdGVTY3JpcHRQcm9jZXNzb3IoIGJ1ZmZlclNpemUsIDIsIG91dHB1dENoYW5uZWxzKTtcblxuICAgICAgc2NyaXB0UHJvY2Vzc29yLnBhcmFtZXRlcnMgPSBuZXcgTWFwKCk7XG4gICAgICBpZiAocHJvY2Vzc29yLnByb3BlcnRpZXMpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9jZXNzb3IucHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHByb3AgPSBwcm9jZXNzb3IucHJvcGVydGllc1tpXTtcbiAgICAgICAgICBjb25zdCBub2RlID0gY29udGV4dC5jcmVhdGVHYWluKCkuZ2FpbjtcbiAgICAgICAgICBub2RlLnZhbHVlID0gcHJvcC5kZWZhdWx0VmFsdWU7XG4gICAgICAgICAgLy8gQFRPRE8gdGhlcmUncyBubyBnb29kIHdheSB0byBjb25zdHJ1Y3QgdGhlIHByb3h5IEF1ZGlvUGFyYW0gaGVyZVxuICAgICAgICAgIHNjcmlwdFByb2Nlc3Nvci5wYXJhbWV0ZXJzLnNldChwcm9wLm5hbWUsIG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1jID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICBuZXh0UG9ydCA9IG1jLnBvcnQyO1xuICAgICAgY29uc3QgaW5zdCA9IG5ldyBwcm9jZXNzb3IuUHJvY2Vzc29yKG9wdGlvbnMgfHwge30pO1xuICAgICAgbmV4dFBvcnQgPSBudWxsO1xuXG4gICAgICBzY3JpcHRQcm9jZXNzb3IucG9ydCA9IG1jLnBvcnQxO1xuICAgICAgc2NyaXB0UHJvY2Vzc29yLnByb2Nlc3NvciA9IHByb2Nlc3NvcjtcbiAgICAgIHNjcmlwdFByb2Nlc3Nvci5pbnN0YW5jZSA9IGluc3Q7XG4gICAgICBzY3JpcHRQcm9jZXNzb3Iub25hdWRpb3Byb2Nlc3MgPSBvbkF1ZGlvUHJvY2VzcztcbiAgICAgIHJldHVybiBzY3JpcHRQcm9jZXNzb3I7XG4gICAgfTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSgoc2VsZi5BdWRpb0NvbnRleHQgfHwgc2VsZi53ZWJraXRBdWRpb0NvbnRleHQpLnByb3RvdHlwZSwgJ2F1ZGlvV29ya2xldCcsIHtcbiAgICAgIGdldCAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiQkYXVkaW9Xb3JrbGV0IHx8ICh0aGlzLiQkYXVkaW9Xb3JrbGV0ID0gbmV3IHNlbGYuQXVkaW9Xb3JrbGV0KHRoaXMpKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qIFhYWCAtIEFEREVEIFRPIE9WRVJDT01FIFBST0JMRU0gSU4gU0FGQVJJIFdIRVJFIEFVRElPV09SS0xFVFBST0NFU1NPUiBQUk9UT1RZUEUgSVMgTk9UIEFOIE9CSkVDVCAqL1xuICAgIGNvbnN0IEF1ZGlvV29ya2xldFByb2Nlc3NvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5wb3J0ID0gbmV4dFBvcnRcbiAgICB9XG4gICAgQXVkaW9Xb3JrbGV0UHJvY2Vzc29yLnByb3RvdHlwZSA9IHt9XG5cbiAgICBzZWxmLkF1ZGlvV29ya2xldCA9IGNsYXNzIEF1ZGlvV29ya2xldCB7XG4gICAgICBjb25zdHJ1Y3RvciAoYXVkaW9Db250ZXh0KSB7XG4gICAgICAgIHRoaXMuJCRjb250ZXh0ID0gYXVkaW9Db250ZXh0O1xuICAgICAgfVxuXG4gICAgICBhZGRNb2R1bGUgKHVybCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gZmV0Y2godXJsKS50aGVuKHIgPT4ge1xuICAgICAgICAgIGlmICghci5vaykgdGhyb3cgRXJyb3Ioci5zdGF0dXMpO1xuICAgICAgICAgIHJldHVybiByLnRleHQoKTtcbiAgICAgICAgfSkudGhlbiggY29kZSA9PiB7XG4gICAgICAgICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgICAgICAgIHNhbXBsZVJhdGU6IHRoaXMuJCRjb250ZXh0LnNhbXBsZVJhdGUsXG4gICAgICAgICAgICBjdXJyZW50VGltZTogdGhpcy4kJGNvbnRleHQuY3VycmVudFRpbWUsXG4gICAgICAgICAgICBBdWRpb1dvcmtsZXRQcm9jZXNzb3IsXG4gICAgICAgICAgICByZWdpc3RlclByb2Nlc3NvcjogKG5hbWUsIFByb2Nlc3NvcikgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBwcm9jZXNzb3JzID0gZ2V0UHJvY2Vzc29yc0ZvckNvbnRleHQodGhpcy4kJGNvbnRleHQpO1xuICAgICAgICAgICAgICBwcm9jZXNzb3JzW25hbWVdID0ge1xuICAgICAgICAgICAgICAgIHJlYWxtLFxuICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgICAgUHJvY2Vzc29yLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IFByb2Nlc3Nvci5wYXJhbWV0ZXJEZXNjcmlwdG9ycyB8fCBbXVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBjb250ZXh0LnNlbGYgPSBjb250ZXh0O1xuICAgICAgICAgIGNvbnN0IHJlYWxtID0gbmV3IFJlYWxtKGNvbnRleHQsIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCk7XG4gICAgICAgICAgcmVhbG0uZXhlYygoKG9wdGlvbnMgJiYgb3B0aW9ucy50cmFuc3BpbGUpIHx8IFN0cmluZykoY29kZSkpO1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gb25BdWRpb1Byb2Nlc3MgKGUpIHtcbiAgICBjb25zdCBwYXJhbWV0ZXJzID0ge307XG4gICAgbGV0IGluZGV4ID0gLTE7XG4gICAgdGhpcy5wYXJhbWV0ZXJzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGNvbnN0IGFyciA9IFBBUkFNU1srK2luZGV4XSB8fCAoUEFSQU1TW2luZGV4XSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5idWZmZXJTaXplKSk7XG4gICAgICAvLyBAVE9ETyBwcm9wZXIgdmFsdWVzIGhlcmUgaWYgcG9zc2libGVcbiAgICAgIGFyci5maWxsKHZhbHVlLnZhbHVlKTtcbiAgICAgIHBhcmFtZXRlcnNba2V5XSA9IGFycjtcbiAgICB9KTtcbiAgICB0aGlzLnByb2Nlc3Nvci5yZWFsbS5leGVjKFxuICAgICAgJ3NlbGYuc2FtcGxlUmF0ZT1zYW1wbGVSYXRlPScgKyB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSArICc7JyArXG4gICAgICAnc2VsZi5jdXJyZW50VGltZT1jdXJyZW50VGltZT0nICsgdGhpcy5jb250ZXh0LmN1cnJlbnRUaW1lXG4gICAgKTtcbiAgICBjb25zdCBpbnB1dHMgPSBjaGFubmVsVG9BcnJheShlLmlucHV0QnVmZmVyKTtcbiAgICBjb25zdCBvdXRwdXRzID0gY2hhbm5lbFRvQXJyYXkoZS5vdXRwdXRCdWZmZXIpO1xuICAgIHRoaXMuaW5zdGFuY2UucHJvY2VzcyhbaW5wdXRzXSwgW291dHB1dHNdLCBwYXJhbWV0ZXJzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNoYW5uZWxUb0FycmF5IChjaCkge1xuICAgIGNvbnN0IG91dCA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2gubnVtYmVyT2ZDaGFubmVsczsgaSsrKSB7XG4gICAgICBvdXRbaV0gPSBjaC5nZXRDaGFubmVsRGF0YShpKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFByb2Nlc3NvcnNGb3JDb250ZXh0IChhdWRpb0NvbnRleHQpIHtcbiAgICByZXR1cm4gYXVkaW9Db250ZXh0LiQkcHJvY2Vzc29ycyB8fCAoYXVkaW9Db250ZXh0LiQkcHJvY2Vzc29ycyA9IHt9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFXUEZcbiIsIi8qKlxuICogQ29weXJpZ2h0IDIwMTggR29vZ2xlIExMQ1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90XG4gKiB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZlxuICogdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUXG4gKiBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGVcbiAqIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zIHVuZGVyXG4gKiB0aGUgTGljZW5zZS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIFJlYWxtIChzY29wZSwgcGFyZW50RWxlbWVudCkge1xuICBjb25zdCBmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICBmcmFtZS5zdHlsZS5jc3NUZXh0ID0gJ3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MDt0b3A6LTk5OXB4O3dpZHRoOjFweDtoZWlnaHQ6MXB4Oyc7XG4gIHBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoZnJhbWUpO1xuICBjb25zdCB3aW4gPSBmcmFtZS5jb250ZW50V2luZG93O1xuICBjb25zdCBkb2MgPSB3aW4uZG9jdW1lbnQ7XG4gIGxldCB2YXJzID0gJ3ZhciB3aW5kb3csJGhvb2snO1xuICBmb3IgKGNvbnN0IGkgaW4gd2luKSB7XG4gICAgaWYgKCEoaSBpbiBzY29wZSkgJiYgaSAhPT0gJ2V2YWwnKSB7XG4gICAgICB2YXJzICs9ICcsJztcbiAgICAgIHZhcnMgKz0gaTtcbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBpIGluIHNjb3BlKSB7XG4gICAgdmFycyArPSAnLCc7XG4gICAgdmFycyArPSBpO1xuICAgIHZhcnMgKz0gJz1zZWxmLic7XG4gICAgdmFycyArPSBpO1xuICB9XG4gIGNvbnN0IHNjcmlwdCA9IGRvYy5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgc2NyaXB0LmFwcGVuZENoaWxkKGRvYy5jcmVhdGVUZXh0Tm9kZShcbiAgICBgZnVuY3Rpb24gJGhvb2soc2VsZixjb25zb2xlKSB7XCJ1c2Ugc3RyaWN0XCI7XG4gICAgICAgICR7dmFyc307cmV0dXJuIGZ1bmN0aW9uKCkge3JldHVybiBldmFsKGFyZ3VtZW50c1swXSl9fWBcbiAgKSk7XG4gIGRvYy5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gIHRoaXMuZXhlYyA9IHdpbi4kaG9vay5jYWxsKHNjb3BlLCBzY29wZSwgY29uc29sZSk7XG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgbmFtZTonZmxvb3InLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICAvL2dlbi5jbG9zdXJlcy5hZGQoeyBbIHRoaXMubmFtZSBdOiBNYXRoLmZsb29yIH0pXG5cbiAgICAgIG91dCA9IGAoICR7aW5wdXRzWzBdfSB8IDAgKWBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBpbnB1dHNbMF0gfCAwXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHggPT4ge1xuICBsZXQgZmxvb3IgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgZmxvb3IuaW5wdXRzID0gWyB4IF1cblxuICByZXR1cm4gZmxvb3Jcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonZm9sZCcsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBjb2RlLFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksXG4gICAgICAgIG91dFxuXG4gICAgb3V0ID0gdGhpcy5jcmVhdGVDYWxsYmFjayggaW5wdXRzWzBdLCB0aGlzLm1pbiwgdGhpcy5tYXggKSBcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IHRoaXMubmFtZSArICdfdmFsdWUnXG5cbiAgICByZXR1cm4gWyB0aGlzLm5hbWUgKyAnX3ZhbHVlJywgb3V0IF1cbiAgfSxcblxuICBjcmVhdGVDYWxsYmFjayggdiwgbG8sIGhpICkge1xuICAgIGxldCBvdXQgPVxuYCB2YXIgJHt0aGlzLm5hbWV9X3ZhbHVlID0gJHt2fSxcbiAgICAgICR7dGhpcy5uYW1lfV9yYW5nZSA9ICR7aGl9IC0gJHtsb30sXG4gICAgICAke3RoaXMubmFtZX1fbnVtV3JhcHMgPSAwXG5cbiAgaWYoJHt0aGlzLm5hbWV9X3ZhbHVlID49ICR7aGl9KXtcbiAgICAke3RoaXMubmFtZX1fdmFsdWUgLT0gJHt0aGlzLm5hbWV9X3JhbmdlXG4gICAgaWYoJHt0aGlzLm5hbWV9X3ZhbHVlID49ICR7aGl9KXtcbiAgICAgICR7dGhpcy5uYW1lfV9udW1XcmFwcyA9ICgoJHt0aGlzLm5hbWV9X3ZhbHVlIC0gJHtsb30pIC8gJHt0aGlzLm5hbWV9X3JhbmdlKSB8IDBcbiAgICAgICR7dGhpcy5uYW1lfV92YWx1ZSAtPSAke3RoaXMubmFtZX1fcmFuZ2UgKiAke3RoaXMubmFtZX1fbnVtV3JhcHNcbiAgICB9XG4gICAgJHt0aGlzLm5hbWV9X251bVdyYXBzKytcbiAgfSBlbHNlIGlmKCR7dGhpcy5uYW1lfV92YWx1ZSA8ICR7bG99KXtcbiAgICAke3RoaXMubmFtZX1fdmFsdWUgKz0gJHt0aGlzLm5hbWV9X3JhbmdlXG4gICAgaWYoJHt0aGlzLm5hbWV9X3ZhbHVlIDwgJHtsb30pe1xuICAgICAgJHt0aGlzLm5hbWV9X251bVdyYXBzID0gKCgke3RoaXMubmFtZX1fdmFsdWUgLSAke2xvfSkgLyAke3RoaXMubmFtZX1fcmFuZ2UtIDEpIHwgMFxuICAgICAgJHt0aGlzLm5hbWV9X3ZhbHVlIC09ICR7dGhpcy5uYW1lfV9yYW5nZSAqICR7dGhpcy5uYW1lfV9udW1XcmFwc1xuICAgIH1cbiAgICAke3RoaXMubmFtZX1fbnVtV3JhcHMtLVxuICB9XG4gIGlmKCR7dGhpcy5uYW1lfV9udW1XcmFwcyAmIDEpICR7dGhpcy5uYW1lfV92YWx1ZSA9ICR7aGl9ICsgJHtsb30gLSAke3RoaXMubmFtZX1fdmFsdWVcbmBcbiAgICByZXR1cm4gJyAnICsgb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIGluMSwgbWluPTAsIG1heD0xICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7IFxuICAgIG1pbiwgXG4gICAgbWF4LFxuICAgIHVpZDogICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogWyBpbjEgXSxcbiAgfSlcbiAgXG4gIHVnZW4ubmFtZSA9IGAke3VnZW4uYmFzZW5hbWV9JHt1Z2VuLnVpZH1gXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2dhdGUnLFxuICBjb250cm9sU3RyaW5nOm51bGwsIC8vIGluc2VydCBpbnRvIG91dHB1dCBjb2RlZ2VuIGZvciBkZXRlcm1pbmluZyBpbmRleGluZ1xuICBnZW4oKSB7XG4gICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSwgb3V0XG4gICAgXG4gICAgZ2VuLnJlcXVlc3RNZW1vcnkoIHRoaXMubWVtb3J5IClcbiAgICBcbiAgICBsZXQgbGFzdElucHV0TWVtb3J5SWR4ID0gJ21lbW9yeVsgJyArIHRoaXMubWVtb3J5Lmxhc3RJbnB1dC5pZHggKyAnIF0nLFxuICAgICAgICBvdXRwdXRNZW1vcnlTdGFydElkeCA9IHRoaXMubWVtb3J5Lmxhc3RJbnB1dC5pZHggKyAxLFxuICAgICAgICBpbnB1dFNpZ25hbCA9IGlucHV0c1swXSxcbiAgICAgICAgY29udHJvbFNpZ25hbCA9IGlucHV0c1sxXVxuICAgIFxuICAgIC8qIFxuICAgICAqIHdlIGNoZWNrIHRvIHNlZSBpZiB0aGUgY3VycmVudCBjb250cm9sIGlucHV0cyBlcXVhbHMgb3VyIGxhc3QgaW5wdXRcbiAgICAgKiBpZiBzbywgd2Ugc3RvcmUgdGhlIHNpZ25hbCBpbnB1dCBpbiB0aGUgbWVtb3J5IGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudGx5XG4gICAgICogc2VsZWN0ZWQgaW5kZXguIElmIG5vdCwgd2UgcHV0IDAgaW4gdGhlIG1lbW9yeSBhc3NvY2lhdGVkIHdpdGggdGhlIGxhc3Qgc2VsZWN0ZWQgaW5kZXgsXG4gICAgICogY2hhbmdlIHRoZSBzZWxlY3RlZCBpbmRleCwgYW5kIHRoZW4gc3RvcmUgdGhlIHNpZ25hbCBpbiBwdXQgaW4gdGhlIG1lbWVyeSBhc3NvaWNhdGVkXG4gICAgICogd2l0aCB0aGUgbmV3bHkgc2VsZWN0ZWQgaW5kZXhcbiAgICAgKi9cbiAgICBcbiAgICBvdXQgPVxuXG5gIGlmKCAke2NvbnRyb2xTaWduYWx9ICE9PSAke2xhc3RJbnB1dE1lbW9yeUlkeH0gKSB7XG4gICAgbWVtb3J5WyAke2xhc3RJbnB1dE1lbW9yeUlkeH0gKyAke291dHB1dE1lbW9yeVN0YXJ0SWR4fSAgXSA9IDAgXG4gICAgJHtsYXN0SW5wdXRNZW1vcnlJZHh9ID0gJHtjb250cm9sU2lnbmFsfVxuICB9XG4gIG1lbW9yeVsgJHtvdXRwdXRNZW1vcnlTdGFydElkeH0gKyAke2NvbnRyb2xTaWduYWx9IF0gPSAke2lucHV0U2lnbmFsfVxuXG5gXG4gICAgdGhpcy5jb250cm9sU3RyaW5nID0gaW5wdXRzWzFdXG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWVcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IHRoaXMubmFtZVxuXG4gICAgdGhpcy5vdXRwdXRzLmZvckVhY2goIHYgPT4gdi5nZW4oKSApXG5cbiAgICByZXR1cm4gWyBudWxsLCAnICcgKyBvdXQgXVxuICB9LFxuXG4gIGNoaWxkZ2VuKCkge1xuICAgIGlmKCB0aGlzLnBhcmVudC5pbml0aWFsaXplZCA9PT0gZmFsc2UgKSB7XG4gICAgICBnZW4uZ2V0SW5wdXRzKCB0aGlzICkgLy8gcGFyZW50IGdhdGUgaXMgb25seSBpbnB1dCBvZiBhIGdhdGUgb3V0cHV0LCBzaG91bGQgb25seSBiZSBnZW4nZCBvbmNlLlxuICAgIH1cblxuICAgIGlmKCBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIGdlbi5yZXF1ZXN0TWVtb3J5KCB0aGlzLm1lbW9yeSApXG5cbiAgICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IGBtZW1vcnlbICR7dGhpcy5tZW1vcnkudmFsdWUuaWR4fSBdYFxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gIGBtZW1vcnlbICR7dGhpcy5tZW1vcnkudmFsdWUuaWR4fSBdYFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCBjb250cm9sLCBpbjEsIHByb3BlcnRpZXMgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKSxcbiAgICAgIGRlZmF1bHRzID0geyBjb3VudDogMiB9XG5cbiAgaWYoIHR5cGVvZiBwcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQgKSBPYmplY3QuYXNzaWduKCBkZWZhdWx0cywgcHJvcGVydGllcyApXG5cbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwge1xuICAgIG91dHB1dHM6IFtdLFxuICAgIHVpZDogICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6ICBbIGluMSwgY29udHJvbCBdLFxuICAgIG1lbW9yeToge1xuICAgICAgbGFzdElucHV0OiB7IGxlbmd0aDoxLCBpZHg6bnVsbCB9XG4gICAgfSxcbiAgICBpbml0aWFsaXplZDpmYWxzZVxuICB9LFxuICBkZWZhdWx0cyApXG4gIFxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7Z2VuLmdldFVJRCgpfWBcblxuICBmb3IoIGxldCBpID0gMDsgaSA8IHVnZW4uY291bnQ7IGkrKyApIHtcbiAgICB1Z2VuLm91dHB1dHMucHVzaCh7XG4gICAgICBpbmRleDppLFxuICAgICAgZ2VuOiBwcm90by5jaGlsZGdlbixcbiAgICAgIHBhcmVudDp1Z2VuLFxuICAgICAgaW5wdXRzOiBbIHVnZW4gXSxcbiAgICAgIG1lbW9yeToge1xuICAgICAgICB2YWx1ZTogeyBsZW5ndGg6MSwgaWR4Om51bGwgfVxuICAgICAgfSxcbiAgICAgIGluaXRpYWxpemVkOmZhbHNlLFxuICAgICAgbmFtZTogYCR7dWdlbi5uYW1lfV9vdXQke2dlbi5nZXRVSUQoKX1gXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxuLyogZ2VuLmpzXG4gKlxuICogbG93LWxldmVsIGNvZGUgZ2VuZXJhdGlvbiBmb3IgdW5pdCBnZW5lcmF0b3JzXG4gKlxuICovXG5jb25zdCBNZW1vcnlIZWxwZXIgPSByZXF1aXJlKCAnbWVtb3J5LWhlbHBlcicgKVxuY29uc3QgRUUgPSByZXF1aXJlKCAnZXZlbnRzJyApLkV2ZW50RW1pdHRlclxuXG5jb25zdCBnZW4gPSB7XG5cbiAgYWNjdW06MCxcbiAgZ2V0VUlEKCkgeyByZXR1cm4gdGhpcy5hY2N1bSsrIH0sXG4gIGRlYnVnOmZhbHNlLFxuICBzYW1wbGVyYXRlOiA0NDEwMCwgLy8gY2hhbmdlIG9uIGF1ZGlvY29udGV4dCBjcmVhdGlvblxuICBzaG91bGRMb2NhbGl6ZTogZmFsc2UsXG4gIGdyYXBoOm51bGwsXG4gIGdsb2JhbHM6e1xuICAgIHdpbmRvd3M6IHt9LFxuICB9LFxuICBtb2RlOid3b3JrbGV0JyxcbiAgXG4gIC8qIGNsb3N1cmVzXG4gICAqXG4gICAqIEZ1bmN0aW9ucyB0aGF0IGFyZSBpbmNsdWRlZCBhcyBhcmd1bWVudHMgdG8gbWFzdGVyIGNhbGxiYWNrLiBFeGFtcGxlczogTWF0aC5hYnMsIE1hdGgucmFuZG9tIGV0Yy5cbiAgICogWFhYIFNob3VsZCBwcm9iYWJseSBiZSByZW5hbWVkIGNhbGxiYWNrUHJvcGVydGllcyBvciBzb21ldGhpbmcgc2ltaWxhci4uLiBjbG9zdXJlcyBhcmUgbm8gbG9uZ2VyIHVzZWQuXG4gICAqL1xuXG4gIGNsb3N1cmVzOiBuZXcgU2V0KCksXG4gIHBhcmFtczogICBuZXcgU2V0KCksXG4gIGlucHV0czogICBuZXcgU2V0KCksXG5cbiAgcGFyYW1ldGVyczogbmV3IFNldCgpLFxuICBlbmRCbG9jazogbmV3IFNldCgpLFxuICBoaXN0b3JpZXM6IG5ldyBNYXAoKSxcblxuICBtZW1vOiB7fSxcblxuICAvL2RhdGE6IHt9LFxuICBcbiAgLyogZXhwb3J0XG4gICAqXG4gICAqIHBsYWNlIGdlbiBmdW5jdGlvbnMgaW50byBhbm90aGVyIG9iamVjdCBmb3IgZWFzaWVyIHJlZmVyZW5jZVxuICAgKi9cblxuICBleHBvcnQoIG9iaiApIHt9LFxuXG4gIGFkZFRvRW5kQmxvY2soIHYgKSB7XG4gICAgdGhpcy5lbmRCbG9jay5hZGQoICcgICcgKyB2IClcbiAgfSxcbiAgXG4gIHJlcXVlc3RNZW1vcnkoIG1lbW9yeVNwZWMsIGltbXV0YWJsZT1mYWxzZSApIHtcbiAgICBmb3IoIGxldCBrZXkgaW4gbWVtb3J5U3BlYyApIHtcbiAgICAgIGxldCByZXF1ZXN0ID0gbWVtb3J5U3BlY1sga2V5IF1cblxuICAgICAgLy9jb25zb2xlLmxvZyggJ3JlcXVlc3RpbmcgJyArIGtleSArICc6JyAsIEpTT04uc3RyaW5naWZ5KCByZXF1ZXN0ICkgKVxuXG4gICAgICBpZiggcmVxdWVzdC5sZW5ndGggPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgY29uc29sZS5sb2coICd1bmRlZmluZWQgbGVuZ3RoIGZvcjonLCBrZXkgKVxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHJlcXVlc3QuaWR4ID0gZ2VuLm1lbW9yeS5hbGxvYyggcmVxdWVzdC5sZW5ndGgsIGltbXV0YWJsZSApXG4gICAgfVxuICB9LFxuXG4gIGNyZWF0ZU1lbW9yeSggYW1vdW50PTQwOTYsIHR5cGUgKSB7XG4gICAgY29uc3QgbWVtID0gTWVtb3J5SGVscGVyLmNyZWF0ZSggYW1vdW50LCB0eXBlIClcbiAgICByZXR1cm4gbWVtXG4gIH0sXG5cbiAgY3JlYXRlQ2FsbGJhY2soIHVnZW4sIG1lbSwgZGVidWcgPSBmYWxzZSwgc2hvdWxkSW5saW5lTWVtb3J5PWZhbHNlLCBtZW1UeXBlID0gRmxvYXQ2NEFycmF5ICkge1xuICAgIGxldCBpc1N0ZXJlbyA9IEFycmF5LmlzQXJyYXkoIHVnZW4gKSAmJiB1Z2VuLmxlbmd0aCA+IDEsXG4gICAgICAgIGNhbGxiYWNrLCBcbiAgICAgICAgY2hhbm5lbDEsIGNoYW5uZWwyXG5cbiAgICBpZiggdHlwZW9mIG1lbSA9PT0gJ251bWJlcicgfHwgbWVtID09PSB1bmRlZmluZWQgKSB7XG4gICAgICB0aGlzLm1lbW9yeSA9IHRoaXMuY3JlYXRlTWVtb3J5KCBtZW0sIG1lbVR5cGUgKVxuICAgIH1lbHNle1xuICAgICAgdGhpcy5tZW1vcnkgPSBtZW1cbiAgICB9XG4gICAgXG4gICAgdGhpcy5vdXRwdXRJZHggPSB0aGlzLm1lbW9yeS5hbGxvYyggMiwgdHJ1ZSApXG4gICAgdGhpcy5lbWl0KCAnbWVtb3J5IGluaXQnIClcblxuICAgIC8vY29uc29sZS5sb2coICdjYiBtZW1vcnk6JywgbWVtIClcbiAgICB0aGlzLmdyYXBoID0gdWdlblxuICAgIHRoaXMubWVtbyA9IHt9IFxuICAgIHRoaXMuZW5kQmxvY2suY2xlYXIoKVxuICAgIHRoaXMuY2xvc3VyZXMuY2xlYXIoKVxuICAgIHRoaXMuaW5wdXRzLmNsZWFyKClcbiAgICB0aGlzLnBhcmFtcy5jbGVhcigpXG4gICAgdGhpcy5nbG9iYWxzID0geyB3aW5kb3dzOnt9IH1cbiAgICBcbiAgICB0aGlzLnBhcmFtZXRlcnMuY2xlYXIoKVxuICAgIFxuICAgIHRoaXMuZnVuY3Rpb25Cb2R5ID0gXCIgICd1c2Ugc3RyaWN0J1xcblwiXG4gICAgaWYoIHNob3VsZElubGluZU1lbW9yeT09PWZhbHNlICkge1xuICAgICAgdGhpcy5mdW5jdGlvbkJvZHkgKz0gdGhpcy5tb2RlID09PSAnd29ya2xldCcgPyBcbiAgICAgICAgXCIgIHZhciBtZW1vcnkgPSB0aGlzLm1lbW9yeVxcblxcblwiIDpcbiAgICAgICAgXCIgIHZhciBtZW1vcnkgPSBnZW4ubWVtb3J5XFxuXFxuXCJcbiAgICB9XG5cbiAgICAvLyBjYWxsIC5nZW4oKSBvbiB0aGUgaGVhZCBvZiB0aGUgZ3JhcGggd2UgYXJlIGdlbmVyYXRpbmcgdGhlIGNhbGxiYWNrIGZvclxuICAgIC8vY29uc29sZS5sb2coICdIRUFEJywgdWdlbiApXG4gICAgZm9yKCBsZXQgaSA9IDA7IGkgPCAxICsgaXNTdGVyZW87IGkrKyApIHtcbiAgICAgIGlmKCB0eXBlb2YgdWdlbltpXSA9PT0gJ251bWJlcicgKSBjb250aW51ZVxuXG4gICAgICAvL2xldCBjaGFubmVsID0gaXNTdGVyZW8gPyB1Z2VuW2ldLmdlbigpIDogdWdlbi5nZW4oKSxcbiAgICAgIGxldCBjaGFubmVsID0gaXNTdGVyZW8gPyB0aGlzLmdldElucHV0KCB1Z2VuW2ldICkgOiB0aGlzLmdldElucHV0KCB1Z2VuICksIFxuICAgICAgICAgIGJvZHkgPSAnJ1xuXG4gICAgICAvLyBpZiAuZ2VuKCkgcmV0dXJucyBhcnJheSwgYWRkIHVnZW4gY2FsbGJhY2sgKGdyYXBoT3V0cHV0WzFdKSB0byBvdXIgb3V0cHV0IGZ1bmN0aW9ucyBib2R5XG4gICAgICAvLyBhbmQgdGhlbiByZXR1cm4gbmFtZSBvZiB1Z2VuLiBJZiAuZ2VuKCkgb25seSBnZW5lcmF0ZXMgYSBudW1iZXIgKGZvciByZWFsbHkgc2ltcGxlIGdyYXBocylcbiAgICAgIC8vIGp1c3QgcmV0dXJuIHRoYXQgbnVtYmVyIChncmFwaE91dHB1dFswXSkuXG4gICAgICBib2R5ICs9IEFycmF5LmlzQXJyYXkoIGNoYW5uZWwgKSA/IGNoYW5uZWxbMV0gKyAnXFxuJyArIGNoYW5uZWxbMF0gOiBjaGFubmVsXG5cbiAgICAgIC8vIHNwbGl0IGJvZHkgdG8gaW5qZWN0IHJldHVybiBrZXl3b3JkIG9uIGxhc3QgbGluZVxuICAgICAgYm9keSA9IGJvZHkuc3BsaXQoJ1xcbicpXG4gICAgIFxuICAgICAgLy9pZiggZGVidWcgKSBjb25zb2xlLmxvZyggJ2Z1bmN0aW9uQm9keSBsZW5ndGgnLCBib2R5IClcbiAgICAgIFxuICAgICAgLy8gbmV4dCBsaW5lIGlzIHRvIGFjY29tbW9kYXRlIG1lbW8gYXMgZ3JhcGggaGVhZFxuICAgICAgaWYoIGJvZHlbIGJvZHkubGVuZ3RoIC0xIF0udHJpbSgpLmluZGV4T2YoJ2xldCcpID4gLTEgKSB7IGJvZHkucHVzaCggJ1xcbicgKSB9IFxuXG4gICAgICAvLyBnZXQgaW5kZXggb2YgbGFzdCBsaW5lXG4gICAgICBsZXQgbGFzdGlkeCA9IGJvZHkubGVuZ3RoIC0gMVxuXG4gICAgICAvLyBpbnNlcnQgcmV0dXJuIGtleXdvcmRcbiAgICAgIGJvZHlbIGxhc3RpZHggXSA9ICcgIG1lbW9yeVsnICsgKHRoaXMub3V0cHV0SWR4ICsgaSkgKyAnXSAgPSAnICsgYm9keVsgbGFzdGlkeCBdICsgJ1xcbidcblxuICAgICAgdGhpcy5mdW5jdGlvbkJvZHkgKz0gYm9keS5qb2luKCdcXG4nKVxuICAgIH1cbiAgICBcbiAgICB0aGlzLmhpc3Rvcmllcy5mb3JFYWNoKCB2YWx1ZSA9PiB7XG4gICAgICBpZiggdmFsdWUgIT09IG51bGwgKVxuICAgICAgICB2YWx1ZS5nZW4oKSAgICAgIFxuICAgIH0pXG5cbiAgICBjb25zdCByZXR1cm5TdGF0ZW1lbnQgPSBpc1N0ZXJlbyA/IGAgIHJldHVybiBbIG1lbW9yeVske3RoaXMub3V0cHV0SWR4fV0sIG1lbW9yeVske3RoaXMub3V0cHV0SWR4ICsgMX1dIF1gIDogYCAgcmV0dXJuIG1lbW9yeVske3RoaXMub3V0cHV0SWR4fV1gXG4gICAgXG4gICAgdGhpcy5mdW5jdGlvbkJvZHkgPSB0aGlzLmZ1bmN0aW9uQm9keS5zcGxpdCgnXFxuJylcblxuICAgIGlmKCB0aGlzLmVuZEJsb2NrLnNpemUgKSB7IFxuICAgICAgdGhpcy5mdW5jdGlvbkJvZHkgPSB0aGlzLmZ1bmN0aW9uQm9keS5jb25jYXQoIEFycmF5LmZyb20oIHRoaXMuZW5kQmxvY2sgKSApXG4gICAgICB0aGlzLmZ1bmN0aW9uQm9keS5wdXNoKCByZXR1cm5TdGF0ZW1lbnQgKVxuICAgIH1lbHNle1xuICAgICAgdGhpcy5mdW5jdGlvbkJvZHkucHVzaCggcmV0dXJuU3RhdGVtZW50IClcbiAgICB9XG4gICAgLy8gcmVhc3NlbWJsZSBmdW5jdGlvbiBib2R5XG4gICAgdGhpcy5mdW5jdGlvbkJvZHkgPSB0aGlzLmZ1bmN0aW9uQm9keS5qb2luKCdcXG4nKVxuXG4gICAgLy8gd2UgY2FuIG9ubHkgZHluYW1pY2FsbHkgY3JlYXRlIGEgbmFtZWQgZnVuY3Rpb24gYnkgZHluYW1pY2FsbHkgY3JlYXRpbmcgYW5vdGhlciBmdW5jdGlvblxuICAgIC8vIHRvIGNvbnN0cnVjdCB0aGUgbmFtZWQgZnVuY3Rpb24hIHNoZWVzaC4uLlxuICAgIC8vXG4gICAgaWYoIHNob3VsZElubGluZU1lbW9yeSA9PT0gdHJ1ZSApIHtcbiAgICAgIHRoaXMucGFyYW1ldGVycy5hZGQoICdtZW1vcnknIClcbiAgICB9XG5cbiAgICBsZXQgcGFyYW1TdHJpbmcgPSAnJ1xuICAgIGlmKCB0aGlzLm1vZGUgPT09ICd3b3JrbGV0JyApIHtcbiAgICAgIGZvciggbGV0IG5hbWUgb2YgdGhpcy5wYXJhbWV0ZXJzLnZhbHVlcygpICkge1xuICAgICAgICBwYXJhbVN0cmluZyArPSBuYW1lICsgJywnXG4gICAgICB9XG4gICAgICBwYXJhbVN0cmluZyA9IHBhcmFtU3RyaW5nLnNsaWNlKDAsLTEpXG4gICAgfVxuXG4gICAgY29uc3Qgc2VwYXJhdG9yID0gdGhpcy5wYXJhbWV0ZXJzLnNpemUgIT09IDAgJiYgdGhpcy5pbnB1dHMuc2l6ZSA+IDAgPyAnLCAnIDogJydcblxuICAgIGxldCBpbnB1dFN0cmluZyA9ICcnXG4gICAgaWYoIHRoaXMubW9kZSA9PT0gJ3dvcmtsZXQnICkge1xuICAgICAgZm9yKCBsZXQgdWdlbiBvZiB0aGlzLmlucHV0cy52YWx1ZXMoKSApIHtcbiAgICAgICAgaW5wdXRTdHJpbmcgKz0gdWdlbi5uYW1lICsgJywnXG4gICAgICB9XG4gICAgICBpbnB1dFN0cmluZyA9IGlucHV0U3RyaW5nLnNsaWNlKDAsLTEpXG4gICAgfVxuXG4gICAgbGV0IGJ1aWxkU3RyaW5nID0gdGhpcy5tb2RlID09PSAnd29ya2xldCdcbiAgICAgID8gYHJldHVybiBmdW5jdGlvbiggJHtpbnB1dFN0cmluZ30gJHtzZXBhcmF0b3J9ICR7cGFyYW1TdHJpbmd9ICl7IFxcbiR7IHRoaXMuZnVuY3Rpb25Cb2R5IH1cXG59YFxuICAgICAgOiBgcmV0dXJuIGZ1bmN0aW9uIGdlbiggJHsgWy4uLnRoaXMucGFyYW1ldGVyc10uam9pbignLCcpIH0gKXsgXFxuJHsgdGhpcy5mdW5jdGlvbkJvZHkgfVxcbn1gXG4gICAgXG4gICAgaWYoIHRoaXMuZGVidWcgfHwgZGVidWcgKSBjb25zb2xlLmxvZyggYnVpbGRTdHJpbmcgKSBcblxuICAgIGNhbGxiYWNrID0gbmV3IEZ1bmN0aW9uKCBidWlsZFN0cmluZyApKClcblxuICAgIC8vIGFzc2lnbiBwcm9wZXJ0aWVzIHRvIG5hbWVkIGZ1bmN0aW9uXG4gICAgZm9yKCBsZXQgZGljdCBvZiB0aGlzLmNsb3N1cmVzLnZhbHVlcygpICkge1xuICAgICAgbGV0IG5hbWUgPSBPYmplY3Qua2V5cyggZGljdCApWzBdLFxuICAgICAgICAgIHZhbHVlID0gZGljdFsgbmFtZSBdXG5cbiAgICAgIGNhbGxiYWNrWyBuYW1lIF0gPSB2YWx1ZVxuICAgIH1cblxuICAgIGZvciggbGV0IGRpY3Qgb2YgdGhpcy5wYXJhbXMudmFsdWVzKCkgKSB7XG4gICAgICBsZXQgbmFtZSA9IE9iamVjdC5rZXlzKCBkaWN0IClbMF0sXG4gICAgICAgICAgdWdlbiA9IGRpY3RbIG5hbWUgXVxuICAgICAgXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIGNhbGxiYWNrLCBuYW1lLCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0KCkgeyByZXR1cm4gdWdlbi52YWx1ZSB9LFxuICAgICAgICBzZXQodil7IHVnZW4udmFsdWUgPSB2IH1cbiAgICAgIH0pXG4gICAgICAvL2NhbGxiYWNrWyBuYW1lIF0gPSB2YWx1ZVxuICAgIH1cblxuICAgIGNhbGxiYWNrLm1lbWJlcnMgPSB0aGlzLmNsb3N1cmVzXG4gICAgY2FsbGJhY2suZGF0YSA9IHRoaXMuZGF0YVxuICAgIGNhbGxiYWNrLnBhcmFtcyA9IHRoaXMucGFyYW1zXG4gICAgY2FsbGJhY2suaW5wdXRzID0gdGhpcy5pbnB1dHNcbiAgICBjYWxsYmFjay5wYXJhbWV0ZXJzID0gdGhpcy5wYXJhbWV0ZXJzLy8uc2xpY2UoIDAgKVxuICAgIGNhbGxiYWNrLm91dCA9IHRoaXMubWVtb3J5LmhlYXAuc3ViYXJyYXkoIHRoaXMub3V0cHV0SWR4LCB0aGlzLm91dHB1dElkeCArIDIgKVxuICAgIGNhbGxiYWNrLmlzU3RlcmVvID0gaXNTdGVyZW9cblxuICAgIC8vaWYoIE1lbW9yeUhlbHBlci5pc1Byb3RvdHlwZU9mKCB0aGlzLm1lbW9yeSApICkgXG4gICAgY2FsbGJhY2subWVtb3J5ID0gdGhpcy5tZW1vcnkuaGVhcFxuXG4gICAgdGhpcy5oaXN0b3JpZXMuY2xlYXIoKVxuXG4gICAgcmV0dXJuIGNhbGxiYWNrXG4gIH0sXG4gIFxuICAvKiBnZXRJbnB1dHNcbiAgICpcbiAgICogQ2FsbGVkIGJ5IGVhY2ggaW5kaXZpZHVhbCB1Z2VuIHdoZW4gdGhlaXIgLmdlbigpIG1ldGhvZCBpcyBjYWxsZWQgdG8gcmVzb2x2ZSB0aGVpciB2YXJpb3VzIGlucHV0cy5cbiAgICogSWYgYW4gaW5wdXQgaXMgYSBudW1iZXIsIHJldHVybiB0aGUgbnVtYmVyLiBJZlxuICAgKiBpdCBpcyBhbiB1Z2VuLCBjYWxsIC5nZW4oKSBvbiB0aGUgdWdlbiwgbWVtb2l6ZSB0aGUgcmVzdWx0IGFuZCByZXR1cm4gdGhlIHJlc3VsdC4gSWYgdGhlXG4gICAqIHVnZW4gaGFzIHByZXZpb3VzbHkgYmVlbiBtZW1vaXplZCByZXR1cm4gdGhlIG1lbW9pemVkIHZhbHVlLlxuICAgKlxuICAgKi9cbiAgZ2V0SW5wdXRzKCB1Z2VuICkge1xuICAgIHJldHVybiB1Z2VuLmlucHV0cy5tYXAoIGdlbi5nZXRJbnB1dCApIFxuICB9LFxuXG4gIGdldElucHV0KCBpbnB1dCApIHtcbiAgICBsZXQgaXNPYmplY3QgPSB0eXBlb2YgaW5wdXQgPT09ICdvYmplY3QnLFxuICAgICAgICBwcm9jZXNzZWRJbnB1dFxuXG4gICAgaWYoIGlzT2JqZWN0ICkgeyAvLyBpZiBpbnB1dCBpcyBhIHVnZW4uLi4gXG4gICAgICAvL2NvbnNvbGUubG9nKCBpbnB1dC5uYW1lLCBnZW4ubWVtb1sgaW5wdXQubmFtZSBdIClcbiAgICAgIGlmKCBnZW4ubWVtb1sgaW5wdXQubmFtZSBdICkgeyAvLyBpZiBpdCBoYXMgYmVlbiBtZW1vaXplZC4uLlxuICAgICAgICBwcm9jZXNzZWRJbnB1dCA9IGdlbi5tZW1vWyBpbnB1dC5uYW1lIF1cbiAgICAgIH1lbHNlIGlmKCBBcnJheS5pc0FycmF5KCBpbnB1dCApICkge1xuICAgICAgICBnZW4uZ2V0SW5wdXQoIGlucHV0WzBdIClcbiAgICAgICAgZ2VuLmdldElucHV0KCBpbnB1dFsxXSApXG4gICAgICB9ZWxzZXsgLy8gaWYgbm90IG1lbW9pemVkIGdlbmVyYXRlIGNvZGUgIFxuICAgICAgICBpZiggdHlwZW9mIGlucHV0LmdlbiAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyggJ25vIGdlbiBmb3VuZDonLCBpbnB1dCwgaW5wdXQuZ2VuIClcbiAgICAgICAgICBpbnB1dCA9IGlucHV0LmdyYXBoXG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNvZGUgPSBpbnB1dC5nZW4oKVxuICAgICAgICAvL2lmKCBjb2RlLmluZGV4T2YoICdPYmplY3QnICkgPiAtMSApIGNvbnNvbGUubG9nKCAnYmFkIGlucHV0OicsIGlucHV0LCBjb2RlIClcbiAgICAgICAgXG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCBjb2RlICkgKSB7XG4gICAgICAgICAgaWYoICFnZW4uc2hvdWxkTG9jYWxpemUgKSB7XG4gICAgICAgICAgICBnZW4uZnVuY3Rpb25Cb2R5ICs9IGNvZGVbMV1cbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGdlbi5jb2RlTmFtZSA9IGNvZGVbMF1cbiAgICAgICAgICAgIGdlbi5sb2NhbGl6ZWRDb2RlLnB1c2goIGNvZGVbMV0gKVxuICAgICAgICAgIH1cbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCAnYWZ0ZXIgR0VOJyAsIHRoaXMuZnVuY3Rpb25Cb2R5IClcbiAgICAgICAgICBwcm9jZXNzZWRJbnB1dCA9IGNvZGVbMF1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgcHJvY2Vzc2VkSW5wdXQgPSBjb2RlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9ZWxzZXsgLy8gaXQgaW5wdXQgaXMgYSBudW1iZXJcbiAgICAgIHByb2Nlc3NlZElucHV0ID0gaW5wdXRcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvY2Vzc2VkSW5wdXRcbiAgfSxcblxuICBzdGFydExvY2FsaXplKCkge1xuICAgIHRoaXMubG9jYWxpemVkQ29kZSA9IFtdXG4gICAgdGhpcy5zaG91bGRMb2NhbGl6ZSA9IHRydWVcbiAgfSxcbiAgZW5kTG9jYWxpemUoKSB7XG4gICAgdGhpcy5zaG91bGRMb2NhbGl6ZSA9IGZhbHNlXG5cbiAgICByZXR1cm4gWyB0aGlzLmNvZGVOYW1lLCB0aGlzLmxvY2FsaXplZENvZGUuc2xpY2UoMCkgXVxuICB9LFxuXG4gIGZyZWUoIGdyYXBoICkge1xuICAgIGlmKCBBcnJheS5pc0FycmF5KCBncmFwaCApICkgeyAvLyBzdGVyZW8gdWdlblxuICAgICAgZm9yKCBsZXQgY2hhbm5lbCBvZiBncmFwaCApIHtcbiAgICAgICAgdGhpcy5mcmVlKCBjaGFubmVsIClcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoIHR5cGVvZiBncmFwaCA9PT0gJ29iamVjdCcgKSB7XG4gICAgICAgIGlmKCBncmFwaC5tZW1vcnkgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICBmb3IoIGxldCBtZW1vcnlLZXkgaW4gZ3JhcGgubWVtb3J5ICkge1xuICAgICAgICAgICAgdGhpcy5tZW1vcnkuZnJlZSggZ3JhcGgubWVtb3J5WyBtZW1vcnlLZXkgXS5pZHggKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiggQXJyYXkuaXNBcnJheSggZ3JhcGguaW5wdXRzICkgKSB7XG4gICAgICAgICAgZm9yKCBsZXQgdWdlbiBvZiBncmFwaC5pbnB1dHMgKSB7XG4gICAgICAgICAgICB0aGlzLmZyZWUoIHVnZW4gKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5nZW4uX19wcm90b19fID0gbmV3IEVFKClcblxubW9kdWxlLmV4cG9ydHMgPSBnZW5cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonZ3QnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcbiAgICBcbiAgICBvdXQgPSBgICB2YXIgJHt0aGlzLm5hbWV9ID0gYCAgXG5cbiAgICBpZiggaXNOYU4oIHRoaXMuaW5wdXRzWzBdICkgfHwgaXNOYU4oIHRoaXMuaW5wdXRzWzFdICkgKSB7XG4gICAgICBvdXQgKz0gYCgoICR7aW5wdXRzWzBdfSA+ICR7aW5wdXRzWzFdfSkgfCAwIClgXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCArPSBpbnB1dHNbMF0gPiBpbnB1dHNbMV0gPyAxIDogMCBcbiAgICB9XG4gICAgb3V0ICs9ICdcXG5cXG4nXG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWVcblxuICAgIHJldHVybiBbdGhpcy5uYW1lLCBvdXRdXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoeCx5KSA9PiB7XG4gIGxldCBndCA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBndC5pbnB1dHMgPSBbIHgseSBdXG4gIGd0Lm5hbWUgPSBndC5iYXNlbmFtZSArIGdlbi5nZXRVSUQoKVxuXG4gIHJldHVybiBndFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgbmFtZTonZ3RlJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG4gICAgXG4gICAgb3V0ID0gYCAgdmFyICR7dGhpcy5uYW1lfSA9IGAgIFxuXG4gICAgaWYoIGlzTmFOKCB0aGlzLmlucHV0c1swXSApIHx8IGlzTmFOKCB0aGlzLmlucHV0c1sxXSApICkge1xuICAgICAgb3V0ICs9IGAoICR7aW5wdXRzWzBdfSA+PSAke2lucHV0c1sxXX0gfCAwIClgXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCArPSBpbnB1dHNbMF0gPj0gaW5wdXRzWzFdID8gMSA6IDAgXG4gICAgfVxuICAgIG91dCArPSAnXFxuXFxuJ1xuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lXG5cbiAgICByZXR1cm4gW3RoaXMubmFtZSwgb3V0XVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKHgseSkgPT4ge1xuICBsZXQgZ3QgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgZ3QuaW5wdXRzID0gWyB4LHkgXVxuICBndC5uYW1lID0gJ2d0ZScgKyBnZW4uZ2V0VUlEKClcblxuICByZXR1cm4gZ3Rcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBuYW1lOidndHAnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIGlmKCBpc05hTiggdGhpcy5pbnB1dHNbMF0gKSB8fCBpc05hTiggdGhpcy5pbnB1dHNbMV0gKSApIHtcbiAgICAgIG91dCA9IGAoJHtpbnB1dHNbIDAgXX0gKiAoICggJHtpbnB1dHNbMF19ID4gJHtpbnB1dHNbMV19ICkgfCAwICkgKWAgXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IGlucHV0c1swXSAqICggKCBpbnB1dHNbMF0gPiBpbnB1dHNbMV0gKSB8IDAgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoeCx5KSA9PiB7XG4gIGxldCBndHAgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgZ3RwLmlucHV0cyA9IFsgeCx5IF1cblxuICByZXR1cm4gZ3RwXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbm1vZHVsZS5leHBvcnRzID0gKCBpbjE9MCApID0+IHtcbiAgbGV0IHVnZW4gPSB7XG4gICAgaW5wdXRzOiBbIGluMSBdLFxuICAgIG1lbW9yeTogeyB2YWx1ZTogeyBsZW5ndGg6MSwgaWR4OiBudWxsIH0gfSxcbiAgICByZWNvcmRlcjogbnVsbCxcblxuICAgIGluKCB2ICkge1xuICAgICAgaWYoIGdlbi5oaXN0b3JpZXMuaGFzKCB2ICkgKXtcbiAgICAgICAgbGV0IG1lbW9IaXN0b3J5ID0gZ2VuLmhpc3Rvcmllcy5nZXQoIHYgKVxuICAgICAgICB1Z2VuLm5hbWUgPSBtZW1vSGlzdG9yeS5uYW1lXG4gICAgICAgIHJldHVybiBtZW1vSGlzdG9yeVxuICAgICAgfVxuXG4gICAgICBsZXQgb2JqID0ge1xuICAgICAgICBnZW4oKSB7XG4gICAgICAgICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHVnZW4gKVxuXG4gICAgICAgICAgaWYoIHVnZW4ubWVtb3J5LnZhbHVlLmlkeCA9PT0gbnVsbCApIHtcbiAgICAgICAgICAgIGdlbi5yZXF1ZXN0TWVtb3J5KCB1Z2VuLm1lbW9yeSApXG4gICAgICAgICAgICBnZW4ubWVtb3J5LmhlYXBbIHVnZW4ubWVtb3J5LnZhbHVlLmlkeCBdID0gaW4xXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IGlkeCA9IHVnZW4ubWVtb3J5LnZhbHVlLmlkeFxuICAgICAgICAgIFxuICAgICAgICAgIGdlbi5hZGRUb0VuZEJsb2NrKCAnbWVtb3J5WyAnICsgaWR4ICsgJyBdID0gJyArIGlucHV0c1sgMCBdIClcbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZXR1cm4gdWdlbiB0aGF0IGlzIGJlaW5nIHJlY29yZGVkIGluc3RlYWQgb2Ygc3NkLlxuICAgICAgICAgIC8vIHRoaXMgZWZmZWN0aXZlbHkgbWFrZXMgYSBjYWxsIHRvIHNzZC5yZWNvcmQoKSB0cmFuc3BhcmVudCB0byB0aGUgZ3JhcGguXG4gICAgICAgICAgLy8gcmVjb3JkaW5nIGlzIHRyaWdnZXJlZCBieSBwcmlvciBjYWxsIHRvIGdlbi5hZGRUb0VuZEJsb2NrLlxuICAgICAgICAgIGdlbi5oaXN0b3JpZXMuc2V0KCB2LCBvYmogKVxuXG4gICAgICAgICAgcmV0dXJuIGlucHV0c1sgMCBdXG4gICAgICAgIH0sXG4gICAgICAgIG5hbWU6IHVnZW4ubmFtZSArICdfaW4nK2dlbi5nZXRVSUQoKSxcbiAgICAgICAgbWVtb3J5OiB1Z2VuLm1lbW9yeVxuICAgICAgfVxuXG4gICAgICB0aGlzLmlucHV0c1sgMCBdID0gdlxuICAgICAgXG4gICAgICB1Z2VuLnJlY29yZGVyID0gb2JqXG5cbiAgICAgIHJldHVybiBvYmpcbiAgICB9LFxuICAgIFxuICAgIG91dDoge1xuICAgICAgICAgICAgXG4gICAgICBnZW4oKSB7XG4gICAgICAgIGlmKCB1Z2VuLm1lbW9yeS52YWx1ZS5pZHggPT09IG51bGwgKSB7XG4gICAgICAgICAgaWYoIGdlbi5oaXN0b3JpZXMuZ2V0KCB1Z2VuLmlucHV0c1swXSApID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICBnZW4uaGlzdG9yaWVzLnNldCggdWdlbi5pbnB1dHNbMF0sIHVnZW4ucmVjb3JkZXIgKVxuICAgICAgICAgIH1cbiAgICAgICAgICBnZW4ucmVxdWVzdE1lbW9yeSggdWdlbi5tZW1vcnkgKVxuICAgICAgICAgIGdlbi5tZW1vcnkuaGVhcFsgdWdlbi5tZW1vcnkudmFsdWUuaWR4IF0gPSBwYXJzZUZsb2F0KCBpbjEgKVxuICAgICAgICB9XG4gICAgICAgIGxldCBpZHggPSB1Z2VuLm1lbW9yeS52YWx1ZS5pZHhcbiAgICAgICAgIFxuICAgICAgICByZXR1cm4gJ21lbW9yeVsgJyArIGlkeCArICcgXSAnXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICB1aWQ6IGdlbi5nZXRVSUQoKSxcbiAgfVxuICBcbiAgdWdlbi5vdXQubWVtb3J5ID0gdWdlbi5tZW1vcnkgXG5cbiAgdWdlbi5uYW1lID0gJ2hpc3RvcnknICsgdWdlbi51aWRcbiAgdWdlbi5vdXQubmFtZSA9IHVnZW4ubmFtZSArICdfb3V0J1xuICB1Z2VuLmluLl9uYW1lICA9IHVnZW4ubmFtZSA9ICdfaW4nXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCB1Z2VuLCAndmFsdWUnLCB7XG4gICAgZ2V0KCkge1xuICAgICAgaWYoIHRoaXMubWVtb3J5LnZhbHVlLmlkeCAhPT0gbnVsbCApIHtcbiAgICAgICAgcmV0dXJuIGdlbi5tZW1vcnkuaGVhcFsgdGhpcy5tZW1vcnkudmFsdWUuaWR4IF1cbiAgICAgIH1cbiAgICB9LFxuICAgIHNldCggdiApIHtcbiAgICAgIGlmKCB0aGlzLm1lbW9yeS52YWx1ZS5pZHggIT09IG51bGwgKSB7XG4gICAgICAgIGdlbi5tZW1vcnkuaGVhcFsgdGhpcy5tZW1vcnkudmFsdWUuaWR4IF0gPSB2IFxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gPSByZXF1aXJlKCAnLi9nZW4uanMnIClcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonaWZlbHNlJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGNvbmRpdGlvbmFscyA9IHRoaXMuaW5wdXRzWzBdLFxuICAgICAgICBkZWZhdWx0VmFsdWUgPSBnZW4uZ2V0SW5wdXQoIGNvbmRpdGlvbmFsc1sgY29uZGl0aW9uYWxzLmxlbmd0aCAtIDFdICksXG4gICAgICAgIG91dCA9IGAgIHZhciAke3RoaXMubmFtZX1fb3V0ID0gJHtkZWZhdWx0VmFsdWV9XFxuYCBcblxuICAgIC8vY29uc29sZS5sb2coICdjb25kaXRpb25hbHM6JywgdGhpcy5uYW1lLCBjb25kaXRpb25hbHMgKVxuXG4gICAgLy9jb25zb2xlLmxvZyggJ2RlZmF1bHRWYWx1ZTonLCBkZWZhdWx0VmFsdWUgKVxuXG4gICAgZm9yKCBsZXQgaSA9IDA7IGkgPCBjb25kaXRpb25hbHMubGVuZ3RoIC0gMjsgaSs9IDIgKSB7XG4gICAgICBsZXQgaXNFbmRCbG9jayA9IGkgPT09IGNvbmRpdGlvbmFscy5sZW5ndGggLSAzLFxuICAgICAgICAgIGNvbmQgID0gZ2VuLmdldElucHV0KCBjb25kaXRpb25hbHNbIGkgXSApLFxuICAgICAgICAgIHByZWJsb2NrID0gY29uZGl0aW9uYWxzWyBpKzEgXSxcbiAgICAgICAgICBibG9jaywgYmxvY2tOYW1lLCBvdXRwdXRcblxuICAgICAgLy9jb25zb2xlLmxvZyggJ3BiJywgcHJlYmxvY2sgKVxuXG4gICAgICBpZiggdHlwZW9mIHByZWJsb2NrID09PSAnbnVtYmVyJyApe1xuICAgICAgICBibG9jayA9IHByZWJsb2NrXG4gICAgICAgIGJsb2NrTmFtZSA9IG51bGxcbiAgICAgIH1lbHNle1xuICAgICAgICBpZiggZ2VuLm1lbW9bIHByZWJsb2NrLm5hbWUgXSA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgIC8vIHVzZWQgdG8gcGxhY2UgYWxsIGNvZGUgZGVwZW5kZW5jaWVzIGluIGFwcHJvcHJpYXRlIGJsb2Nrc1xuICAgICAgICAgIGdlbi5zdGFydExvY2FsaXplKClcblxuICAgICAgICAgIGdlbi5nZXRJbnB1dCggcHJlYmxvY2sgKVxuXG4gICAgICAgICAgYmxvY2sgPSBnZW4uZW5kTG9jYWxpemUoKVxuICAgICAgICAgIGJsb2NrTmFtZSA9IGJsb2NrWzBdXG4gICAgICAgICAgYmxvY2sgPSBibG9ja1sgMSBdLmpvaW4oJycpXG4gICAgICAgICAgYmxvY2sgPSAnICAnICsgYmxvY2sucmVwbGFjZSggL1xcbi9naSwgJ1xcbiAgJyApXG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIGJsb2NrID0gJydcbiAgICAgICAgICBibG9ja05hbWUgPSBnZW4ubWVtb1sgcHJlYmxvY2submFtZSBdXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgb3V0cHV0ID0gYmxvY2tOYW1lID09PSBudWxsID8gXG4gICAgICAgIGAgICR7dGhpcy5uYW1lfV9vdXQgPSAke2Jsb2NrfWAgOlxuICAgICAgICBgJHtibG9ja30gICR7dGhpcy5uYW1lfV9vdXQgPSAke2Jsb2NrTmFtZX1gXG4gICAgICBcbiAgICAgIGlmKCBpPT09MCApIG91dCArPSAnICdcbiAgICAgIG91dCArPSBcbmAgaWYoICR7Y29uZH0gPT09IDEgKSB7XG4ke291dHB1dH1cbiAgfWBcblxuICAgICAgaWYoICFpc0VuZEJsb2NrICkge1xuICAgICAgICBvdXQgKz0gYCBlbHNlYFxuICAgICAgfWVsc2V7XG4gICAgICAgIG91dCArPSBgXFxuYFxuICAgICAgfVxuICAgIH1cblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IGAke3RoaXMubmFtZX1fb3V0YFxuXG4gICAgcmV0dXJuIFsgYCR7dGhpcy5uYW1lfV9vdXRgLCBvdXQgXVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCAuLi5hcmdzICApID0+IHtcbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApLFxuICAgICAgY29uZGl0aW9ucyA9IEFycmF5LmlzQXJyYXkoIGFyZ3NbMF0gKSA/IGFyZ3NbMF0gOiBhcmdzXG5cbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwge1xuICAgIHVpZDogICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6ICBbIGNvbmRpdGlvbnMgXSxcbiAgfSlcbiAgXG4gIHVnZW4ubmFtZSA9IGAke3VnZW4uYmFzZW5hbWV9JHt1Z2VuLnVpZH1gXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidpbicsXG5cbiAgZ2VuKCkge1xuICAgIGNvbnN0IGlzV29ya2xldCA9IGdlbi5tb2RlID09PSAnd29ya2xldCdcblxuICAgIGlmKCBpc1dvcmtsZXQgKSB7XG4gICAgICBnZW4uaW5wdXRzLmFkZCggdGhpcyApXG4gICAgfWVsc2V7XG4gICAgICBnZW4ucGFyYW1ldGVycy5hZGQoIHRoaXMubmFtZSApXG4gICAgfVxuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gaXNXb3JrbGV0ID09PSB0cnVlID8gdGhpcy5uYW1lICsgJ1tpXScgOiB0aGlzLm5hbWVcblxuICAgIHJldHVybiBnZW4ubWVtb1sgdGhpcy5uYW1lIF1cbiAgfSBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIG5hbWUsIGlucHV0TnVtYmVyPTAsIGNoYW5uZWxOdW1iZXI9MCwgZGVmYXVsdFZhbHVlPTAsIG1pbj0wLCBtYXg9MSApID0+IHtcbiAgbGV0IGlucHV0ID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIGlucHV0LmlkICAgPSBnZW4uZ2V0VUlEKClcbiAgaW5wdXQubmFtZSA9IG5hbWUgIT09IHVuZGVmaW5lZCA/IG5hbWUgOiBgJHtpbnB1dC5iYXNlbmFtZX0ke2lucHV0LmlkfWBcbiAgT2JqZWN0LmFzc2lnbiggaW5wdXQsIHsgZGVmYXVsdFZhbHVlLCBtaW4sIG1heCwgaW5wdXROdW1iZXIsIGNoYW5uZWxOdW1iZXIgfSlcblxuICBpbnB1dFswXSA9IHtcbiAgICBnZW4oKSB7XG4gICAgICBpZiggISBnZW4ucGFyYW1ldGVycy5oYXMoIGlucHV0Lm5hbWUgKSApIGdlbi5wYXJhbWV0ZXJzLmFkZCggaW5wdXQubmFtZSApXG4gICAgICByZXR1cm4gaW5wdXQubmFtZSArICdbMF0nXG4gICAgfVxuICB9XG4gIGlucHV0WzFdID0ge1xuICAgIGdlbigpIHtcbiAgICAgIGlmKCAhIGdlbi5wYXJhbWV0ZXJzLmhhcyggaW5wdXQubmFtZSApICkgZ2VuLnBhcmFtZXRlcnMuYWRkKCBpbnB1dC5uYW1lIClcbiAgICAgIHJldHVybiBpbnB1dC5uYW1lICsgJ1sxXSdcbiAgICB9XG4gIH1cblxuXG4gIHJldHVybiBpbnB1dFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGxpYnJhcnkgPSB7XG4gIGV4cG9ydCggZGVzdGluYXRpb24gKSB7XG4gICAgaWYoIGRlc3RpbmF0aW9uID09PSB3aW5kb3cgKSB7XG4gICAgICBkZXN0aW5hdGlvbi5zc2QgPSBsaWJyYXJ5Lmhpc3RvcnkgICAgLy8gaGlzdG9yeSBpcyB3aW5kb3cgb2JqZWN0IHByb3BlcnR5LCBzbyB1c2Ugc3NkIGFzIGFsaWFzXG4gICAgICBkZXN0aW5hdGlvbi5pbnB1dCA9IGxpYnJhcnkuaW4gICAgICAgLy8gaW4gaXMgYSBrZXl3b3JkIGluIGphdmFzY3JpcHRcbiAgICAgIGRlc3RpbmF0aW9uLnRlcm5hcnkgPSBsaWJyYXJ5LnN3aXRjaCAvLyBzd2l0Y2ggaXMgYSBrZXl3b3JkIGluIGphdmFzY3JpcHRcblxuICAgICAgZGVsZXRlIGxpYnJhcnkuaGlzdG9yeVxuICAgICAgZGVsZXRlIGxpYnJhcnkuaW5cbiAgICAgIGRlbGV0ZSBsaWJyYXJ5LnN3aXRjaFxuICAgIH1cblxuICAgIE9iamVjdC5hc3NpZ24oIGRlc3RpbmF0aW9uLCBsaWJyYXJ5IClcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggbGlicmFyeSwgJ3NhbXBsZXJhdGUnLCB7XG4gICAgICBnZXQoKSB7IHJldHVybiBsaWJyYXJ5Lmdlbi5zYW1wbGVyYXRlIH0sXG4gICAgICBzZXQodikge31cbiAgICB9KVxuXG4gICAgbGlicmFyeS5pbiA9IGRlc3RpbmF0aW9uLmlucHV0XG4gICAgbGlicmFyeS5oaXN0b3J5ID0gZGVzdGluYXRpb24uc3NkXG4gICAgbGlicmFyeS5zd2l0Y2ggPSBkZXN0aW5hdGlvbi50ZXJuYXJ5XG5cbiAgICBkZXN0aW5hdGlvbi5jbGlwID0gbGlicmFyeS5jbGFtcFxuICB9LFxuXG4gIGdlbjogICAgICByZXF1aXJlKCAnLi9nZW4uanMnICksXG4gIFxuICBhYnM6ICAgICAgcmVxdWlyZSggJy4vYWJzLmpzJyApLFxuICByb3VuZDogICAgcmVxdWlyZSggJy4vcm91bmQuanMnICksXG4gIHBhcmFtOiAgICByZXF1aXJlKCAnLi9wYXJhbS5qcycgKSxcbiAgYWRkOiAgICAgIHJlcXVpcmUoICcuL2FkZC5qcycgKSxcbiAgc3ViOiAgICAgIHJlcXVpcmUoICcuL3N1Yi5qcycgKSxcbiAgbXVsOiAgICAgIHJlcXVpcmUoICcuL211bC5qcycgKSxcbiAgZGl2OiAgICAgIHJlcXVpcmUoICcuL2Rpdi5qcycgKSxcbiAgYWNjdW06ICAgIHJlcXVpcmUoICcuL2FjY3VtLmpzJyApLFxuICBjb3VudGVyOiAgcmVxdWlyZSggJy4vY291bnRlci5qcycgKSxcbiAgc2luOiAgICAgIHJlcXVpcmUoICcuL3Npbi5qcycgKSxcbiAgY29zOiAgICAgIHJlcXVpcmUoICcuL2Nvcy5qcycgKSxcbiAgdGFuOiAgICAgIHJlcXVpcmUoICcuL3Rhbi5qcycgKSxcbiAgdGFuaDogICAgIHJlcXVpcmUoICcuL3RhbmguanMnICksXG4gIGFzaW46ICAgICByZXF1aXJlKCAnLi9hc2luLmpzJyApLFxuICBhY29zOiAgICAgcmVxdWlyZSggJy4vYWNvcy5qcycgKSxcbiAgYXRhbjogICAgIHJlcXVpcmUoICcuL2F0YW4uanMnICksICBcbiAgcGhhc29yOiAgIHJlcXVpcmUoICcuL3BoYXNvci5qcycgKSxcbiAgZGF0YTogICAgIHJlcXVpcmUoICcuL2RhdGEuanMnICksXG4gIHBlZWs6ICAgICByZXF1aXJlKCAnLi9wZWVrLmpzJyApLFxuICBjeWNsZTogICAgcmVxdWlyZSggJy4vY3ljbGUuanMnICksXG4gIGhpc3Rvcnk6ICByZXF1aXJlKCAnLi9oaXN0b3J5LmpzJyApLFxuICBkZWx0YTogICAgcmVxdWlyZSggJy4vZGVsdGEuanMnICksXG4gIGZsb29yOiAgICByZXF1aXJlKCAnLi9mbG9vci5qcycgKSxcbiAgY2VpbDogICAgIHJlcXVpcmUoICcuL2NlaWwuanMnICksXG4gIG1pbjogICAgICByZXF1aXJlKCAnLi9taW4uanMnICksXG4gIG1heDogICAgICByZXF1aXJlKCAnLi9tYXguanMnICksXG4gIHNpZ246ICAgICByZXF1aXJlKCAnLi9zaWduLmpzJyApLFxuICBkY2Jsb2NrOiAgcmVxdWlyZSggJy4vZGNibG9jay5qcycgKSxcbiAgbWVtbzogICAgIHJlcXVpcmUoICcuL21lbW8uanMnICksXG4gIHJhdGU6ICAgICByZXF1aXJlKCAnLi9yYXRlLmpzJyApLFxuICB3cmFwOiAgICAgcmVxdWlyZSggJy4vd3JhcC5qcycgKSxcbiAgbWl4OiAgICAgIHJlcXVpcmUoICcuL21peC5qcycgKSxcbiAgY2xhbXA6ICAgIHJlcXVpcmUoICcuL2NsYW1wLmpzJyApLFxuICBwb2tlOiAgICAgcmVxdWlyZSggJy4vcG9rZS5qcycgKSxcbiAgZGVsYXk6ICAgIHJlcXVpcmUoICcuL2RlbGF5LmpzJyApLFxuICBmb2xkOiAgICAgcmVxdWlyZSggJy4vZm9sZC5qcycgKSxcbiAgbW9kIDogICAgIHJlcXVpcmUoICcuL21vZC5qcycgKSxcbiAgc2FoIDogICAgIHJlcXVpcmUoICcuL3NhaC5qcycgKSxcbiAgbm9pc2U6ICAgIHJlcXVpcmUoICcuL25vaXNlLmpzJyApLFxuICBub3Q6ICAgICAgcmVxdWlyZSggJy4vbm90LmpzJyApLFxuICBndDogICAgICAgcmVxdWlyZSggJy4vZ3QuanMnICksXG4gIGd0ZTogICAgICByZXF1aXJlKCAnLi9ndGUuanMnICksXG4gIGx0OiAgICAgICByZXF1aXJlKCAnLi9sdC5qcycgKSwgXG4gIGx0ZTogICAgICByZXF1aXJlKCAnLi9sdGUuanMnICksIFxuICBib29sOiAgICAgcmVxdWlyZSggJy4vYm9vbC5qcycgKSxcbiAgZ2F0ZTogICAgIHJlcXVpcmUoICcuL2dhdGUuanMnICksXG4gIHRyYWluOiAgICByZXF1aXJlKCAnLi90cmFpbi5qcycgKSxcbiAgc2xpZGU6ICAgIHJlcXVpcmUoICcuL3NsaWRlLmpzJyApLFxuICBpbjogICAgICAgcmVxdWlyZSggJy4vaW4uanMnICksXG4gIHQ2MDogICAgICByZXF1aXJlKCAnLi90NjAuanMnKSxcbiAgbXRvZjogICAgIHJlcXVpcmUoICcuL210b2YuanMnKSxcbiAgbHRwOiAgICAgIHJlcXVpcmUoICcuL2x0cC5qcycpLCAgICAgICAgLy8gVE9ETzogdGVzdFxuICBndHA6ICAgICAgcmVxdWlyZSggJy4vZ3RwLmpzJyksICAgICAgICAvLyBUT0RPOiB0ZXN0XG4gIHN3aXRjaDogICByZXF1aXJlKCAnLi9zd2l0Y2guanMnICksXG4gIG1zdG9zYW1wczpyZXF1aXJlKCAnLi9tc3Rvc2FtcHMuanMnICksIC8vIFRPRE86IG5lZWRzIHRlc3QsXG4gIHNlbGVjdG9yOiByZXF1aXJlKCAnLi9zZWxlY3Rvci5qcycgKSxcbiAgdXRpbGl0aWVzOnJlcXVpcmUoICcuL3V0aWxpdGllcy5qcycgKSxcbiAgcG93OiAgICAgIHJlcXVpcmUoICcuL3Bvdy5qcycgKSxcbiAgYXR0YWNrOiAgIHJlcXVpcmUoICcuL2F0dGFjay5qcycgKSxcbiAgZGVjYXk6ICAgIHJlcXVpcmUoICcuL2RlY2F5LmpzJyApLFxuICB3aW5kb3dzOiAgcmVxdWlyZSggJy4vd2luZG93cy5qcycgKSxcbiAgZW52OiAgICAgIHJlcXVpcmUoICcuL2Vudi5qcycgKSxcbiAgYWQ6ICAgICAgIHJlcXVpcmUoICcuL2FkLmpzJyAgKSxcbiAgYWRzcjogICAgIHJlcXVpcmUoICcuL2Fkc3IuanMnICksXG4gIGlmZWxzZTogICByZXF1aXJlKCAnLi9pZmVsc2VpZi5qcycgKSxcbiAgYmFuZzogICAgIHJlcXVpcmUoICcuL2JhbmcuanMnICksXG4gIGFuZDogICAgICByZXF1aXJlKCAnLi9hbmQuanMnICksXG4gIHBhbjogICAgICByZXF1aXJlKCAnLi9wYW4uanMnICksXG4gIGVxOiAgICAgICByZXF1aXJlKCAnLi9lcS5qcycgKSxcbiAgbmVxOiAgICAgIHJlcXVpcmUoICcuL25lcS5qcycgKSxcbiAgZXhwOiAgICAgIHJlcXVpcmUoICcuL2V4cC5qcycgKSxcbiAgcHJvY2VzczogIHJlcXVpcmUoICcuL3Byb2Nlc3MuanMnICksXG4gIHNlcTogICAgICByZXF1aXJlKCAnLi9zZXEuanMnIClcbn1cblxubGlicmFyeS5nZW4ubGliID0gbGlicmFyeVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxpYnJhcnlcbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonbHQnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIG91dCA9IGAgIHZhciAke3RoaXMubmFtZX0gPSBgICBcblxuICAgIGlmKCBpc05hTiggdGhpcy5pbnB1dHNbMF0gKSB8fCBpc05hTiggdGhpcy5pbnB1dHNbMV0gKSApIHtcbiAgICAgIG91dCArPSBgKCggJHtpbnB1dHNbMF19IDwgJHtpbnB1dHNbMV19KSB8IDAgIClgXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCArPSBpbnB1dHNbMF0gPCBpbnB1dHNbMV0gPyAxIDogMCBcbiAgICB9XG4gICAgb3V0ICs9ICdcXG4nXG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWVcblxuICAgIHJldHVybiBbdGhpcy5uYW1lLCBvdXRdXG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKHgseSkgPT4ge1xuICBsZXQgbHQgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgbHQuaW5wdXRzID0gWyB4LHkgXVxuICBsdC5uYW1lID0gbHQuYmFzZW5hbWUgKyBnZW4uZ2V0VUlEKClcblxuICByZXR1cm4gbHRcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBuYW1lOidsdGUnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIG91dCA9IGAgIHZhciAke3RoaXMubmFtZX0gPSBgICBcblxuICAgIGlmKCBpc05hTiggdGhpcy5pbnB1dHNbMF0gKSB8fCBpc05hTiggdGhpcy5pbnB1dHNbMV0gKSApIHtcbiAgICAgIG91dCArPSBgKCAke2lucHV0c1swXX0gPD0gJHtpbnB1dHNbMV19IHwgMCAgKWBcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ICs9IGlucHV0c1swXSA8PSBpbnB1dHNbMV0gPyAxIDogMCBcbiAgICB9XG4gICAgb3V0ICs9ICdcXG4nXG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWVcblxuICAgIHJldHVybiBbdGhpcy5uYW1lLCBvdXRdXG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKHgseSkgPT4ge1xuICBsZXQgbHQgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgbHQuaW5wdXRzID0gWyB4LHkgXVxuICBsdC5uYW1lID0gJ2x0ZScgKyBnZW4uZ2V0VUlEKClcblxuICByZXR1cm4gbHRcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBuYW1lOidsdHAnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIGlmKCBpc05hTiggdGhpcy5pbnB1dHNbMF0gKSB8fCBpc05hTiggdGhpcy5pbnB1dHNbMV0gKSApIHtcbiAgICAgIG91dCA9IGAoJHtpbnB1dHNbIDAgXX0gKiAoKCAke2lucHV0c1swXX0gPCAke2lucHV0c1sxXX0gKSB8IDAgKSApYCBcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gaW5wdXRzWzBdICogKCggaW5wdXRzWzBdIDwgaW5wdXRzWzFdICkgfCAwIClcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKHgseSkgPT4ge1xuICBsZXQgbHRwID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIGx0cC5pbnB1dHMgPSBbIHgseSBdXG5cbiAgcmV0dXJuIGx0cFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIG5hbWU6J21heCcsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuXG4gICAgXG4gICAgY29uc3QgaXNXb3JrbGV0ID0gZ2VuLm1vZGUgPT09ICd3b3JrbGV0J1xuICAgIGNvbnN0IHJlZiA9IGlzV29ya2xldD8gJycgOiAnZ2VuLidcblxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgfHwgaXNOYU4oIGlucHV0c1sxXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7IFsgdGhpcy5uYW1lIF06IGlzV29ya2xldCA/ICdNYXRoLm1heCcgOiBNYXRoLm1heCB9KVxuXG4gICAgICBvdXQgPSBgJHtyZWZ9bWF4KCAke2lucHV0c1swXX0sICR7aW5wdXRzWzFdfSApYFxuXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IE1hdGgubWF4KCBwYXJzZUZsb2F0KCBpbnB1dHNbMF0gKSwgcGFyc2VGbG9hdCggaW5wdXRzWzFdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoeCx5KSA9PiB7XG4gIGxldCBtYXggPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgbWF4LmlucHV0cyA9IFsgeCx5IF1cblxuICByZXR1cm4gbWF4XG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonbWVtbycsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuICAgIFxuICAgIG91dCA9IGAgIHZhciAke3RoaXMubmFtZX0gPSAke2lucHV0c1swXX1cXG5gXG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWVcblxuICAgIHJldHVybiBbIHRoaXMubmFtZSwgb3V0IF1cbiAgfSBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoaW4xLG1lbW9OYW1lKSA9PiB7XG4gIGxldCBtZW1vID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuICBcbiAgbWVtby5pbnB1dHMgPSBbIGluMSBdXG4gIG1lbW8uaWQgICA9IGdlbi5nZXRVSUQoKVxuICBtZW1vLm5hbWUgPSBtZW1vTmFtZSAhPT0gdW5kZWZpbmVkID8gbWVtb05hbWUgKyAnXycgKyBnZW4uZ2V0VUlEKCkgOiBgJHttZW1vLmJhc2VuYW1lfSR7bWVtby5pZH1gXG5cbiAgcmV0dXJuIG1lbW9cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBuYW1lOidtaW4nLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIFxuICAgIGNvbnN0IGlzV29ya2xldCA9IGdlbi5tb2RlID09PSAnd29ya2xldCdcbiAgICBjb25zdCByZWYgPSBpc1dvcmtsZXQ/ICcnIDogJ2dlbi4nXG5cbiAgICBpZiggaXNOYU4oIGlucHV0c1swXSApIHx8IGlzTmFOKCBpbnB1dHNbMV0gKSApIHtcbiAgICAgIGdlbi5jbG9zdXJlcy5hZGQoeyBbIHRoaXMubmFtZSBdOiBpc1dvcmtsZXQgPyAnTWF0aC5taW4nIDogTWF0aC5taW4gfSlcblxuICAgICAgb3V0ID0gYCR7cmVmfW1pbiggJHtpbnB1dHNbMF19LCAke2lucHV0c1sxXX0gKWBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLm1pbiggcGFyc2VGbG9hdCggaW5wdXRzWzBdICksIHBhcnNlRmxvYXQoIGlucHV0c1sxXSApIClcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKHgseSkgPT4ge1xuICBsZXQgbWluID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIG1pbi5pbnB1dHMgPSBbIHgseSBdXG5cbiAgcmV0dXJuIG1pblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gPSByZXF1aXJlKCcuL2dlbi5qcycpLFxuICAgIGFkZCA9IHJlcXVpcmUoJy4vYWRkLmpzJyksXG4gICAgbXVsID0gcmVxdWlyZSgnLi9tdWwuanMnKSxcbiAgICBzdWIgPSByZXF1aXJlKCcuL3N1Yi5qcycpLFxuICAgIG1lbW89IHJlcXVpcmUoJy4vbWVtby5qcycpXG5cbm1vZHVsZS5leHBvcnRzID0gKCBpbjEsIGluMiwgdD0uNSApID0+IHtcbiAgbGV0IHVnZW4gPSBtZW1vKCBhZGQoIG11bChpbjEsIHN1YigxLHQgKSApLCBtdWwoIGluMiwgdCApICkgKVxuICB1Z2VuLm5hbWUgPSAnbWl4JyArIGdlbi5nZXRVSUQoKVxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubW9kdWxlLmV4cG9ydHMgPSAoLi4uYXJncykgPT4ge1xuICBsZXQgbW9kID0ge1xuICAgIGlkOiAgICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogYXJncyxcblxuICAgIGdlbigpIHtcbiAgICAgIGxldCBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksXG4gICAgICAgICAgb3V0PScoJyxcbiAgICAgICAgICBkaWZmID0gMCwgXG4gICAgICAgICAgbnVtQ291bnQgPSAwLFxuICAgICAgICAgIGxhc3ROdW1iZXIgPSBpbnB1dHNbIDAgXSxcbiAgICAgICAgICBsYXN0TnVtYmVySXNVZ2VuID0gaXNOYU4oIGxhc3ROdW1iZXIgKSwgXG4gICAgICAgICAgbW9kQXRFbmQgPSBmYWxzZVxuXG4gICAgICBpbnB1dHMuZm9yRWFjaCggKHYsaSkgPT4ge1xuICAgICAgICBpZiggaSA9PT0gMCApIHJldHVyblxuXG4gICAgICAgIGxldCBpc051bWJlclVnZW4gPSBpc05hTiggdiApLFxuICAgICAgICAgICAgaXNGaW5hbElkeCAgID0gaSA9PT0gaW5wdXRzLmxlbmd0aCAtIDFcblxuICAgICAgICBpZiggIWxhc3ROdW1iZXJJc1VnZW4gJiYgIWlzTnVtYmVyVWdlbiApIHtcbiAgICAgICAgICBsYXN0TnVtYmVyID0gbGFzdE51bWJlciAlIHZcbiAgICAgICAgICBvdXQgKz0gbGFzdE51bWJlclxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICBvdXQgKz0gYCR7bGFzdE51bWJlcn0gJSAke3Z9YFxuICAgICAgICB9XG5cbiAgICAgICAgaWYoICFpc0ZpbmFsSWR4ICkgb3V0ICs9ICcgJSAnIFxuICAgICAgfSlcblxuICAgICAgb3V0ICs9ICcpJ1xuXG4gICAgICByZXR1cm4gb3V0XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gbW9kXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J21zdG9zYW1wcycsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSxcbiAgICAgICAgcmV0dXJuVmFsdWVcblxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICBvdXQgPSBgICB2YXIgJHt0aGlzLm5hbWUgfSA9ICR7Z2VuLnNhbXBsZXJhdGV9IC8gMTAwMCAqICR7aW5wdXRzWzBdfSBcXG5cXG5gXG4gICAgIFxuICAgICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gb3V0XG4gICAgICBcbiAgICAgIHJldHVyblZhbHVlID0gWyB0aGlzLm5hbWUsIG91dCBdXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IGdlbi5zYW1wbGVyYXRlIC8gMTAwMCAqIHRoaXMuaW5wdXRzWzBdXG5cbiAgICAgIHJldHVyblZhbHVlID0gb3V0XG4gICAgfSAgICBcblxuICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geCA9PiB7XG4gIGxldCBtc3Rvc2FtcHMgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgbXN0b3NhbXBzLmlucHV0cyA9IFsgeCBdXG4gIG1zdG9zYW1wcy5uYW1lID0gcHJvdG8uYmFzZW5hbWUgKyBnZW4uZ2V0VUlEKClcblxuICByZXR1cm4gbXN0b3NhbXBzXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgbmFtZTonbXRvZicsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuXG4gICAgaWYoIGlzTmFOKCBpbnB1dHNbMF0gKSApIHtcbiAgICAgIGdlbi5jbG9zdXJlcy5hZGQoeyBbIHRoaXMubmFtZSBdOiBNYXRoLmV4cCB9KVxuXG4gICAgICBvdXQgPSBgKCAke3RoaXMudHVuaW5nfSAqIGdlbi5leHAoIC4wNTc3NjIyNjUgKiAoJHtpbnB1dHNbMF19IC0gNjkpICkgKWBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSB0aGlzLnR1bmluZyAqIE1hdGguZXhwKCAuMDU3NzYyMjY1ICogKCBpbnB1dHNbMF0gLSA2OSkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIHgsIHByb3BzICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvICksXG4gICAgICBkZWZhdWx0cyA9IHsgdHVuaW5nOjQ0MCB9XG4gIFxuICBpZiggcHJvcHMgIT09IHVuZGVmaW5lZCApIE9iamVjdC5hc3NpZ24oIHByb3BzLmRlZmF1bHRzIClcblxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCBkZWZhdWx0cyApXG4gIHVnZW4uaW5wdXRzID0gWyB4IF1cbiAgXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBnZW4gPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmNvbnN0IHByb3RvID0ge1xuICBiYXNlbmFtZTogJ211bCcsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksXG4gICAgICAgIG91dCA9IGAgIHZhciAke3RoaXMubmFtZX0gPSBgLFxuICAgICAgICBzdW0gPSAxLCBudW1Db3VudCA9IDAsIG11bEF0RW5kID0gZmFsc2UsIGFscmVhZHlGdWxsU3VtbWVkID0gdHJ1ZVxuXG4gICAgaW5wdXRzLmZvckVhY2goICh2LGkpID0+IHtcbiAgICAgIGlmKCBpc05hTiggdiApICkge1xuICAgICAgICBvdXQgKz0gdlxuICAgICAgICBpZiggaSA8IGlucHV0cy5sZW5ndGggLTEgKSB7XG4gICAgICAgICAgbXVsQXRFbmQgPSB0cnVlXG4gICAgICAgICAgb3V0ICs9ICcgKiAnXG4gICAgICAgIH1cbiAgICAgICAgYWxyZWFkeUZ1bGxTdW1tZWQgPSBmYWxzZVxuICAgICAgfWVsc2V7XG4gICAgICAgIGlmKCBpID09PSAwICkge1xuICAgICAgICAgIHN1bSA9IHZcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgc3VtICo9IHBhcnNlRmxvYXQoIHYgKVxuICAgICAgICB9XG4gICAgICAgIG51bUNvdW50KytcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaWYoIG51bUNvdW50ID4gMCApIHtcbiAgICAgIG91dCArPSBtdWxBdEVuZCB8fCBhbHJlYWR5RnVsbFN1bW1lZCA/IHN1bSA6ICcgKiAnICsgc3VtXG4gICAgfVxuXG4gICAgb3V0ICs9ICdcXG4nXG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWVcblxuICAgIHJldHVybiBbIHRoaXMubmFtZSwgb3V0IF1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggLi4uYXJncyApID0+IHtcbiAgY29uc3QgbXVsID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuICBcbiAgT2JqZWN0LmFzc2lnbiggbXVsLCB7XG4gICAgICBpZDogICAgIGdlbi5nZXRVSUQoKSxcbiAgICAgIGlucHV0czogYXJncyxcbiAgfSlcbiAgXG4gIG11bC5uYW1lID0gbXVsLmJhc2VuYW1lICsgbXVsLmlkXG5cbiAgcmV0dXJuIG11bFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gPSByZXF1aXJlKCAnLi9nZW4uanMnIClcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonbmVxJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSwgb3V0XG5cbiAgICBvdXQgPSAvKnRoaXMuaW5wdXRzWzBdICE9PSB0aGlzLmlucHV0c1sxXSA/IDEgOiovIGAgIHZhciAke3RoaXMubmFtZX0gPSAoJHtpbnB1dHNbMF19ICE9PSAke2lucHV0c1sxXX0pIHwgMFxcblxcbmBcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IHRoaXMubmFtZVxuXG4gICAgcmV0dXJuIFsgdGhpcy5uYW1lLCBvdXQgXVxuICB9LFxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCBpbjEsIGluMiApID0+IHtcbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG4gIE9iamVjdC5hc3NpZ24oIHVnZW4sIHtcbiAgICB1aWQ6ICAgICBnZW4uZ2V0VUlEKCksXG4gICAgaW5wdXRzOiAgWyBpbjEsIGluMiBdLFxuICB9KVxuICBcbiAgdWdlbi5uYW1lID0gYCR7dWdlbi5iYXNlbmFtZX0ke3VnZW4udWlkfWBcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIG5hbWU6J25vaXNlJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dFxuXG4gICAgY29uc3QgaXNXb3JrbGV0ID0gZ2VuLm1vZGUgPT09ICd3b3JrbGV0J1xuICAgIGNvbnN0IHJlZiA9IGlzV29ya2xldD8gJycgOiAnZ2VuLidcblxuICAgIGdlbi5jbG9zdXJlcy5hZGQoeyAnbm9pc2UnIDogaXNXb3JrbGV0ID8gJ01hdGgucmFuZG9tJyA6IE1hdGgucmFuZG9tIH0pXG5cbiAgICBvdXQgPSBgICB2YXIgJHt0aGlzLm5hbWV9ID0gJHtyZWZ9bm9pc2UoKVxcbmBcbiAgICBcbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWVcblxuICAgIHJldHVybiBbIHRoaXMubmFtZSwgb3V0IF1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHggPT4ge1xuICBsZXQgbm9pc2UgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG4gIG5vaXNlLm5hbWUgPSBwcm90by5uYW1lICsgZ2VuLmdldFVJRCgpXG5cbiAgcmV0dXJuIG5vaXNlXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgbmFtZTonbm90JyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG5cbiAgICBpZiggaXNOYU4oIHRoaXMuaW5wdXRzWzBdICkgKSB7XG4gICAgICBvdXQgPSBgKCAke2lucHV0c1swXX0gPT09IDAgPyAxIDogMCApYFxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSAhaW5wdXRzWzBdID09PSAwID8gMSA6IDBcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geCA9PiB7XG4gIGxldCBub3QgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgbm90LmlucHV0cyA9IFsgeCBdXG5cbiAgcmV0dXJuIG5vdFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gPSByZXF1aXJlKCAnLi9nZW4uanMnICksXG4gICAgZGF0YSA9IHJlcXVpcmUoICcuL2RhdGEuanMnICksXG4gICAgcGVlayA9IHJlcXVpcmUoICcuL3BlZWsuanMnICksXG4gICAgbXVsICA9IHJlcXVpcmUoICcuL211bC5qcycgKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidwYW4nLCBcbiAgaW5pdFRhYmxlKCkgeyAgICBcbiAgICBsZXQgYnVmZmVyTCA9IG5ldyBGbG9hdDMyQXJyYXkoIDEwMjQgKSxcbiAgICAgICAgYnVmZmVyUiA9IG5ldyBGbG9hdDMyQXJyYXkoIDEwMjQgKVxuXG4gICAgY29uc3QgYW5nVG9SYWQgPSBNYXRoLlBJIC8gMTgwXG4gICAgZm9yKCBsZXQgaSA9IDA7IGkgPCAxMDI0OyBpKysgKSB7IFxuICAgICAgbGV0IHBhbiA9IGkgKiAoIDkwIC8gMTAyNCApXG4gICAgICBidWZmZXJMW2ldID0gTWF0aC5jb3MoIHBhbiAqIGFuZ1RvUmFkICkgXG4gICAgICBidWZmZXJSW2ldID0gTWF0aC5zaW4oIHBhbiAqIGFuZ1RvUmFkIClcbiAgICB9XG5cbiAgICBnZW4uZ2xvYmFscy5wYW5MID0gZGF0YSggYnVmZmVyTCwgMSwgeyBpbW11dGFibGU6dHJ1ZSB9KVxuICAgIGdlbi5nbG9iYWxzLnBhblIgPSBkYXRhKCBidWZmZXJSLCAxLCB7IGltbXV0YWJsZTp0cnVlIH0pXG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggbGVmdElucHV0LCByaWdodElucHV0LCBwYW4gPS41LCBwcm9wZXJ0aWVzICkgPT4ge1xuICBpZiggZ2VuLmdsb2JhbHMucGFuTCA9PT0gdW5kZWZpbmVkICkgcHJvdG8uaW5pdFRhYmxlKClcblxuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7XG4gICAgdWlkOiAgICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogIFsgbGVmdElucHV0LCByaWdodElucHV0IF0sXG4gICAgbGVmdDogICAgbXVsKCBsZWZ0SW5wdXQsIHBlZWsoIGdlbi5nbG9iYWxzLnBhbkwsIHBhbiwgeyBib3VuZG1vZGU6J2NsYW1wJyB9KSApLFxuICAgIHJpZ2h0OiAgIG11bCggcmlnaHRJbnB1dCwgcGVlayggZ2VuLmdsb2JhbHMucGFuUiwgcGFuLCB7IGJvdW5kbW9kZTonY2xhbXAnIH0pIClcbiAgfSlcbiAgXG4gIHVnZW4ubmFtZSA9IGAke3VnZW4uYmFzZW5hbWV9JHt1Z2VuLnVpZH1gXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOiAncGFyYW0nLFxuXG4gIGdlbigpIHtcbiAgICBnZW4ucmVxdWVzdE1lbW9yeSggdGhpcy5tZW1vcnkgKVxuICAgIFxuICAgIGdlbi5wYXJhbXMuYWRkKCB0aGlzIClcblxuICAgIGNvbnN0IGlzV29ya2xldCA9IGdlbi5tb2RlID09PSAnd29ya2xldCdcblxuICAgIGlmKCBpc1dvcmtsZXQgKSBnZW4ucGFyYW1ldGVycy5hZGQoIHRoaXMubmFtZSApXG5cbiAgICB0aGlzLnZhbHVlID0gdGhpcy5pbml0aWFsVmFsdWVcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IGlzV29ya2xldCA/IHRoaXMubmFtZSA6IGBtZW1vcnlbJHt0aGlzLm1lbW9yeS52YWx1ZS5pZHh9XWBcblxuICAgIHJldHVybiBnZW4ubWVtb1sgdGhpcy5uYW1lIF1cbiAgfSBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIHByb3BOYW1lPTAsIHZhbHVlPTAsIG1pbj0wLCBtYXg9MSApID0+IHtcbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG4gIFxuICBpZiggdHlwZW9mIHByb3BOYW1lICE9PSAnc3RyaW5nJyApIHtcbiAgICB1Z2VuLm5hbWUgPSB1Z2VuLmJhc2VuYW1lICsgZ2VuLmdldFVJRCgpXG4gICAgdWdlbi5pbml0aWFsVmFsdWUgPSBwcm9wTmFtZVxuICB9ZWxzZXtcbiAgICB1Z2VuLm5hbWUgPSBwcm9wTmFtZVxuICAgIHVnZW4uaW5pdGlhbFZhbHVlID0gdmFsdWVcbiAgfVxuXG4gIHVnZW4ubWluID0gbWluXG4gIHVnZW4ubWF4ID0gbWF4XG4gIHVnZW4uZGVmYXVsdFZhbHVlID0gdWdlbi5pbml0aWFsVmFsdWVcblxuICAvLyBmb3Igc3RvcmluZyB3b3JrbGV0IG5vZGVzIG9uY2UgdGhleSdyZSBpbnN0YW50aWF0ZWRcbiAgdWdlbi53YWFwaSA9IG51bGxcblxuICB1Z2VuLmlzV29ya2xldCA9IGdlbi5tb2RlID09PSAnd29ya2xldCdcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHVnZW4sICd2YWx1ZScsIHtcbiAgICBnZXQoKSB7XG4gICAgICBpZiggdGhpcy5tZW1vcnkudmFsdWUuaWR4ICE9PSBudWxsICkge1xuICAgICAgICByZXR1cm4gZ2VuLm1lbW9yeS5oZWFwWyB0aGlzLm1lbW9yeS52YWx1ZS5pZHggXVxuICAgICAgfWVsc2V7XG4gICAgICAgIHJldHVybiB0aGlzLmluaXRpYWxWYWx1ZVxuICAgICAgfVxuICAgIH0sXG4gICAgc2V0KCB2ICkge1xuICAgICAgaWYoIHRoaXMubWVtb3J5LnZhbHVlLmlkeCAhPT0gbnVsbCApIHtcbiAgICAgICAgaWYoIHRoaXMuaXNXb3JrbGV0ICYmIHRoaXMud2FhcGkgIT09IG51bGwgKSB7XG4gICAgICAgICAgdGhpcy53YWFwaS52YWx1ZSA9IHZcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgZ2VuLm1lbW9yeS5oZWFwWyB0aGlzLm1lbW9yeS52YWx1ZS5pZHggXSA9IHZcbiAgICAgICAgfSBcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgdWdlbi5tZW1vcnkgPSB7XG4gICAgdmFsdWU6IHsgbGVuZ3RoOjEsIGlkeDpudWxsIH1cbiAgfVxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCJcbmNvbnN0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpLFxuICAgICAgZGF0YVVnZW4gPSByZXF1aXJlKCcuL2RhdGEuanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidwZWVrJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGdlbk5hbWUgPSAnZ2VuLicgKyB0aGlzLm5hbWUsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSxcbiAgICAgICAgb3V0LCBmdW5jdGlvbkJvZHksIG5leHQsIGxlbmd0aElzTG9nMiwgaWR4XG4gICAgXG4gICAgaWR4ID0gaW5wdXRzWzFdXG4gICAgbGVuZ3RoSXNMb2cyID0gKE1hdGgubG9nMiggdGhpcy5kYXRhLmJ1ZmZlci5sZW5ndGggKSB8IDApICA9PT0gTWF0aC5sb2cyKCB0aGlzLmRhdGEuYnVmZmVyLmxlbmd0aCApXG5cbiAgICBpZiggdGhpcy5tb2RlICE9PSAnc2ltcGxlJyApIHtcblxuICAgIGZ1bmN0aW9uQm9keSA9IGAgIHZhciAke3RoaXMubmFtZX1fZGF0YUlkeCAgPSAke2lkeH0sIFxuICAgICAgJHt0aGlzLm5hbWV9X3BoYXNlID0gJHt0aGlzLm1vZGUgPT09ICdzYW1wbGVzJyA/IGlucHV0c1swXSA6IGlucHV0c1swXSArICcgKiAnICsgKHRoaXMuZGF0YS5idWZmZXIubGVuZ3RoKSB9LCBcbiAgICAgICR7dGhpcy5uYW1lfV9pbmRleCA9ICR7dGhpcy5uYW1lfV9waGFzZSB8IDAsXFxuYFxuXG4gICAgaWYoIHRoaXMuYm91bmRtb2RlID09PSAnd3JhcCcgKSB7XG4gICAgICBuZXh0ID0gbGVuZ3RoSXNMb2cyID9cbiAgICAgIGAoICR7dGhpcy5uYW1lfV9pbmRleCArIDEgKSAmICgke3RoaXMuZGF0YS5idWZmZXIubGVuZ3RofSAtIDEpYCA6XG4gICAgICBgJHt0aGlzLm5hbWV9X2luZGV4ICsgMSA+PSAke3RoaXMuZGF0YS5idWZmZXIubGVuZ3RofSA/ICR7dGhpcy5uYW1lfV9pbmRleCArIDEgLSAke3RoaXMuZGF0YS5idWZmZXIubGVuZ3RofSA6ICR7dGhpcy5uYW1lfV9pbmRleCArIDFgXG4gICAgfWVsc2UgaWYoIHRoaXMuYm91bmRtb2RlID09PSAnY2xhbXAnICkge1xuICAgICAgbmV4dCA9IFxuICAgICAgICBgJHt0aGlzLm5hbWV9X2luZGV4ICsgMSA+PSAke3RoaXMuZGF0YS5idWZmZXIubGVuZ3RoIC0gMX0gPyAke3RoaXMuZGF0YS5idWZmZXIubGVuZ3RoIC0gMX0gOiAke3RoaXMubmFtZX1faW5kZXggKyAxYFxuICAgIH0gZWxzZSBpZiggdGhpcy5ib3VuZG1vZGUgPT09ICdmb2xkJyB8fCB0aGlzLmJvdW5kbW9kZSA9PT0gJ21pcnJvcicgKSB7XG4gICAgICBuZXh0ID0gXG4gICAgICAgIGAke3RoaXMubmFtZX1faW5kZXggKyAxID49ICR7dGhpcy5kYXRhLmJ1ZmZlci5sZW5ndGggLSAxfSA/ICR7dGhpcy5uYW1lfV9pbmRleCAtICR7dGhpcy5kYXRhLmJ1ZmZlci5sZW5ndGggLSAxfSA6ICR7dGhpcy5uYW1lfV9pbmRleCArIDFgXG4gICAgfWVsc2V7XG4gICAgICAgbmV4dCA9IFxuICAgICAgYCR7dGhpcy5uYW1lfV9pbmRleCArIDFgICAgICBcbiAgICB9XG5cbiAgICBpZiggdGhpcy5pbnRlcnAgPT09ICdsaW5lYXInICkgeyAgICAgIFxuICAgIGZ1bmN0aW9uQm9keSArPSBgICAgICAgJHt0aGlzLm5hbWV9X2ZyYWMgID0gJHt0aGlzLm5hbWV9X3BoYXNlIC0gJHt0aGlzLm5hbWV9X2luZGV4LFxuICAgICAgJHt0aGlzLm5hbWV9X2Jhc2UgID0gbWVtb3J5WyAke3RoaXMubmFtZX1fZGF0YUlkeCArICAke3RoaXMubmFtZX1faW5kZXggXSxcbiAgICAgICR7dGhpcy5uYW1lfV9uZXh0ICA9ICR7bmV4dH0sYFxuICAgICAgXG4gICAgICBpZiggdGhpcy5ib3VuZG1vZGUgPT09ICdpZ25vcmUnICkge1xuICAgICAgICBmdW5jdGlvbkJvZHkgKz0gYFxuICAgICAgJHt0aGlzLm5hbWV9X291dCAgID0gJHt0aGlzLm5hbWV9X2luZGV4ID49ICR7dGhpcy5kYXRhLmJ1ZmZlci5sZW5ndGggLSAxfSB8fCAke3RoaXMubmFtZX1faW5kZXggPCAwID8gMCA6ICR7dGhpcy5uYW1lfV9iYXNlICsgJHt0aGlzLm5hbWV9X2ZyYWMgKiAoIG1lbW9yeVsgJHt0aGlzLm5hbWV9X2RhdGFJZHggKyAke3RoaXMubmFtZX1fbmV4dCBdIC0gJHt0aGlzLm5hbWV9X2Jhc2UgKVxcblxcbmBcbiAgICAgIH1lbHNle1xuICAgICAgICBmdW5jdGlvbkJvZHkgKz0gYFxuICAgICAgJHt0aGlzLm5hbWV9X291dCAgID0gJHt0aGlzLm5hbWV9X2Jhc2UgKyAke3RoaXMubmFtZX1fZnJhYyAqICggbWVtb3J5WyAke3RoaXMubmFtZX1fZGF0YUlkeCArICR7dGhpcy5uYW1lfV9uZXh0IF0gLSAke3RoaXMubmFtZX1fYmFzZSApXFxuXFxuYFxuICAgICAgfVxuICAgIH1lbHNle1xuICAgICAgZnVuY3Rpb25Cb2R5ICs9IGAgICAgICAke3RoaXMubmFtZX1fb3V0ID0gbWVtb3J5WyAke3RoaXMubmFtZX1fZGF0YUlkeCArICR7dGhpcy5uYW1lfV9pbmRleCBdXFxuXFxuYFxuICAgIH1cblxuICAgIH0gZWxzZSB7IC8vIG1vZGUgaXMgc2ltcGxlXG4gICAgICBmdW5jdGlvbkJvZHkgPSBgbWVtb3J5WyAke2lkeH0gKyAkeyBpbnB1dHNbMF0gfSBdYFxuICAgICAgXG4gICAgICByZXR1cm4gZnVuY3Rpb25Cb2R5XG4gICAgfVxuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lICsgJ19vdXQnXG5cbiAgICByZXR1cm4gWyB0aGlzLm5hbWUrJ19vdXQnLCBmdW5jdGlvbkJvZHkgXVxuICB9LFxuXG4gIGRlZmF1bHRzIDogeyBjaGFubmVsczoxLCBtb2RlOidwaGFzZScsIGludGVycDonbGluZWFyJywgYm91bmRtb2RlOid3cmFwJyB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCBpbnB1dF9kYXRhLCBpbmRleD0wLCBwcm9wZXJ0aWVzICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICAvL2NvbnNvbGUubG9nKCBkYXRhVWdlbiwgZ2VuLmRhdGEgKVxuXG4gIC8vIFhYWCB3aHkgaXMgZGF0YVVnZW4gbm90IHRoZSBhY3R1YWwgZnVuY3Rpb24/IHNvbWUgdHlwZSBvZiBicm93c2VyaWZ5IG5vbnNlbnNlLi4uXG4gIGNvbnN0IGZpbmFsRGF0YSA9IHR5cGVvZiBpbnB1dF9kYXRhLmJhc2VuYW1lID09PSAndW5kZWZpbmVkJyA/IGdlbi5saWIuZGF0YSggaW5wdXRfZGF0YSApIDogaW5wdXRfZGF0YVxuXG4gIE9iamVjdC5hc3NpZ24oIHVnZW4sIFxuICAgIHsgXG4gICAgICAnZGF0YSc6ICAgICBmaW5hbERhdGEsXG4gICAgICBkYXRhTmFtZTogICBmaW5hbERhdGEubmFtZSxcbiAgICAgIHVpZDogICAgICAgIGdlbi5nZXRVSUQoKSxcbiAgICAgIGlucHV0czogICAgIFsgaW5kZXgsIGZpbmFsRGF0YSBdLFxuICAgIH0sXG4gICAgcHJvdG8uZGVmYXVsdHMsXG4gICAgcHJvcGVydGllcyBcbiAgKVxuICBcbiAgdWdlbi5uYW1lID0gdWdlbi5iYXNlbmFtZSArIHVnZW4udWlkXG5cbiAgcmV0dXJuIHVnZW5cbn1cblxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gICA9IHJlcXVpcmUoICcuL2dlbi5qcycgKSxcbiAgICBhY2N1bSA9IHJlcXVpcmUoICcuL2FjY3VtLmpzJyApLFxuICAgIG11bCAgID0gcmVxdWlyZSggJy4vbXVsLmpzJyApLFxuICAgIHByb3RvID0geyBiYXNlbmFtZToncGhhc29yJyB9LFxuICAgIGRpdiAgID0gcmVxdWlyZSggJy4vZGl2LmpzJyApXG5cbmNvbnN0IGRlZmF1bHRzID0geyBtaW46IC0xLCBtYXg6IDEgfVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggZnJlcXVlbmN5ID0gMSwgcmVzZXQgPSAwLCBfcHJvcHMgKSA9PiB7XG4gIGNvbnN0IHByb3BzID0gT2JqZWN0LmFzc2lnbigge30sIGRlZmF1bHRzLCBfcHJvcHMgKVxuXG4gIGNvbnN0IHJhbmdlID0gcHJvcHMubWF4IC0gcHJvcHMubWluXG5cbiAgY29uc3QgdWdlbiA9IHR5cGVvZiBmcmVxdWVuY3kgPT09ICdudW1iZXInIFxuICAgID8gYWNjdW0oIChmcmVxdWVuY3kgKiByYW5nZSkgLyBnZW4uc2FtcGxlcmF0ZSwgcmVzZXQsIHByb3BzICkgXG4gICAgOiBhY2N1bSggXG4gICAgICAgIGRpdiggXG4gICAgICAgICAgbXVsKCBmcmVxdWVuY3ksIHJhbmdlICksXG4gICAgICAgICAgZ2VuLnNhbXBsZXJhdGVcbiAgICAgICAgKSwgXG4gICAgICAgIHJlc2V0LCBwcm9wcyBcbiAgICApXG5cbiAgdWdlbi5uYW1lID0gcHJvdG8uYmFzZW5hbWUgKyBnZW4uZ2V0VUlEKClcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKSxcbiAgICBtdWwgID0gcmVxdWlyZSgnLi9tdWwuanMnKSxcbiAgICB3cmFwID0gcmVxdWlyZSgnLi93cmFwLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZToncG9rZScsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBkYXRhTmFtZSA9ICdtZW1vcnknLFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksXG4gICAgICAgIGlkeCwgb3V0LCB3cmFwcGVkXG4gICAgXG4gICAgaWR4ID0gdGhpcy5kYXRhLmdlbigpXG5cbiAgICAvL2dlbi5yZXF1ZXN0TWVtb3J5KCB0aGlzLm1lbW9yeSApXG4gICAgLy93cmFwcGVkID0gd3JhcCggdGhpcy5pbnB1dHNbMV0sIDAsIHRoaXMuZGF0YUxlbmd0aCApLmdlbigpXG4gICAgLy9pZHggPSB3cmFwcGVkWzBdXG4gICAgLy9nZW4uZnVuY3Rpb25Cb2R5ICs9IHdyYXBwZWRbMV1cbiAgICBsZXQgb3V0cHV0U3RyID0gdGhpcy5pbnB1dHNbMV0gPT09IDAgP1xuICAgICAgYCAgJHtkYXRhTmFtZX1bICR7aWR4fSBdID0gJHtpbnB1dHNbMF19XFxuYCA6XG4gICAgICBgICAke2RhdGFOYW1lfVsgJHtpZHh9ICsgJHtpbnB1dHNbMV19IF0gPSAke2lucHV0c1swXX1cXG5gXG5cbiAgICBpZiggdGhpcy5pbmxpbmUgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIGdlbi5mdW5jdGlvbkJvZHkgKz0gb3V0cHV0U3RyXG4gICAgfWVsc2V7XG4gICAgICByZXR1cm4gWyB0aGlzLmlubGluZSwgb3V0cHV0U3RyIF1cbiAgICB9XG4gIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gKCBkYXRhLCB2YWx1ZSwgaW5kZXgsIHByb3BlcnRpZXMgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKSxcbiAgICAgIGRlZmF1bHRzID0geyBjaGFubmVsczoxIH0gXG5cbiAgaWYoIHByb3BlcnRpZXMgIT09IHVuZGVmaW5lZCApIE9iamVjdC5hc3NpZ24oIGRlZmF1bHRzLCBwcm9wZXJ0aWVzIClcblxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7IFxuICAgIGRhdGEsXG4gICAgZGF0YU5hbWU6ICAgZGF0YS5uYW1lLFxuICAgIGRhdGFMZW5ndGg6IGRhdGEuYnVmZmVyLmxlbmd0aCxcbiAgICB1aWQ6ICAgICAgICBnZW4uZ2V0VUlEKCksXG4gICAgaW5wdXRzOiAgICAgWyB2YWx1ZSwgaW5kZXggXSxcbiAgfSxcbiAgZGVmYXVsdHMgKVxuXG5cbiAgdWdlbi5uYW1lID0gdWdlbi5iYXNlbmFtZSArIHVnZW4udWlkXG4gIFxuICBnZW4uaGlzdG9yaWVzLnNldCggdWdlbi5uYW1lLCB1Z2VuIClcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidwb3cnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcbiAgICBcbiAgICBcbiAgICBjb25zdCBpc1dvcmtsZXQgPSBnZW4ubW9kZSA9PT0gJ3dvcmtsZXQnXG4gICAgY29uc3QgcmVmID0gaXNXb3JrbGV0PyAnJyA6ICdnZW4uJ1xuXG4gICAgaWYoIGlzTmFOKCBpbnB1dHNbMF0gKSB8fCBpc05hTiggaW5wdXRzWzFdICkgKSB7XG4gICAgICBnZW4uY2xvc3VyZXMuYWRkKHsgJ3Bvdyc6IGlzV29ya2xldCA/ICdNYXRoLnBvdycgOiBNYXRoLnBvdyB9KVxuXG4gICAgICBvdXQgPSBgJHtyZWZ9cG93KCAke2lucHV0c1swXX0sICR7aW5wdXRzWzFdfSApYCBcblxuICAgIH0gZWxzZSB7XG4gICAgICBpZiggdHlwZW9mIGlucHV0c1swXSA9PT0gJ3N0cmluZycgJiYgaW5wdXRzWzBdWzBdID09PSAnKCcgKSB7XG4gICAgICAgIGlucHV0c1swXSA9IGlucHV0c1swXS5zbGljZSgxLC0xKVxuICAgICAgfVxuICAgICAgaWYoIHR5cGVvZiBpbnB1dHNbMV0gPT09ICdzdHJpbmcnICYmIGlucHV0c1sxXVswXSA9PT0gJygnICkge1xuICAgICAgICBpbnB1dHNbMV0gPSBpbnB1dHNbMV0uc2xpY2UoMSwtMSlcbiAgICAgIH1cblxuICAgICAgb3V0ID0gTWF0aC5wb3coIHBhcnNlRmxvYXQoIGlucHV0c1swXSApLCBwYXJzZUZsb2F0KCBpbnB1dHNbMV0pIClcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKHgseSkgPT4ge1xuICBsZXQgcG93ID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIHBvdy5pbnB1dHMgPSBbIHgseSBdXG4gIHBvdy5pZCA9IGdlbi5nZXRVSUQoKVxuICBwb3cubmFtZSA9IGAke3Bvdy5iYXNlbmFtZX17cG93LmlkfWBcblxuICByZXR1cm4gcG93XG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5jb25zdCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J3Byb2Nlc3MnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIGdlbi5jbG9zdXJlcy5hZGQoeyBbJycrdGhpcy5mdW5jbmFtZV0gOiB0aGlzLmZ1bmMgfSlcblxuICAgIG91dCA9IGAgIHZhciAke3RoaXMubmFtZX0gPSBnZW5bJyR7dGhpcy5mdW5jbmFtZX0nXShgXG5cbiAgICBpbnB1dHMuZm9yRWFjaCggKHYsaSxhcnIgKSA9PiB7XG4gICAgICBvdXQgKz0gYXJyWyBpIF1cbiAgICAgIGlmKCBpIDwgYXJyLmxlbmd0aCAtIDEgKSBvdXQgKz0gJywnXG4gICAgfSlcblxuICAgIG91dCArPSAnKVxcbidcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IHRoaXMubmFtZVxuXG4gICAgcmV0dXJuIFt0aGlzLm5hbWUsIG91dF1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoLi4uYXJncykgPT4ge1xuICBjb25zdCBwcm9jZXNzID0ge30vLyBPYmplY3QuY3JlYXRlKCBwcm90byApXG4gIGNvbnN0IGlkID0gZ2VuLmdldFVJRCgpXG4gIHByb2Nlc3MubmFtZSA9ICdwcm9jZXNzJyArIGlkIFxuXG4gIHByb2Nlc3MuZnVuYyA9IG5ldyBGdW5jdGlvbiggLi4uYXJncyApXG5cbiAgLy9nZW4uZ2xvYmFsc1sgcHJvY2Vzcy5uYW1lIF0gPSBwcm9jZXNzLmZ1bmNcblxuICBwcm9jZXNzLmNhbGwgPSBmdW5jdGlvbiggLi4uYXJncyAgKSB7XG4gICAgY29uc3Qgb3V0cHV0ID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuICAgIG91dHB1dC5mdW5jbmFtZSA9IHByb2Nlc3MubmFtZVxuICAgIG91dHB1dC5mdW5jID0gcHJvY2Vzcy5mdW5jXG4gICAgb3V0cHV0Lm5hbWUgPSAncHJvY2Vzc19vdXRfJyArIGlkXG4gICAgb3V0cHV0LnByb2Nlc3MgPSBwcm9jZXNzXG5cbiAgICBvdXRwdXQuaW5wdXRzID0gYXJnc1xuXG4gICAgcmV0dXJuIG91dHB1dFxuICB9XG5cbiAgcmV0dXJuIHByb2Nlc3MgXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgICAgPSByZXF1aXJlKCAnLi9nZW4uanMnICksXG4gICAgaGlzdG9yeSA9IHJlcXVpcmUoICcuL2hpc3RvcnkuanMnICksXG4gICAgc3ViICAgICA9IHJlcXVpcmUoICcuL3N1Yi5qcycgKSxcbiAgICBhZGQgICAgID0gcmVxdWlyZSggJy4vYWRkLmpzJyApLFxuICAgIG11bCAgICAgPSByZXF1aXJlKCAnLi9tdWwuanMnICksXG4gICAgbWVtbyAgICA9IHJlcXVpcmUoICcuL21lbW8uanMnICksXG4gICAgZGVsdGEgICA9IHJlcXVpcmUoICcuL2RlbHRhLmpzJyApLFxuICAgIHdyYXAgICAgPSByZXF1aXJlKCAnLi93cmFwLmpzJyApXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J3JhdGUnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApLFxuICAgICAgICBwaGFzZSAgPSBoaXN0b3J5KCksXG4gICAgICAgIGluTWludXMxID0gaGlzdG9yeSgpLFxuICAgICAgICBnZW5OYW1lID0gJ2dlbi4nICsgdGhpcy5uYW1lLFxuICAgICAgICBmaWx0ZXIsIHN1bSwgb3V0XG5cbiAgICBnZW4uY2xvc3VyZXMuYWRkKHsgWyB0aGlzLm5hbWUgXTogdGhpcyB9KSBcblxuICAgIG91dCA9IFxuYCB2YXIgJHt0aGlzLm5hbWV9X2RpZmYgPSAke2lucHV0c1swXX0gLSAke2dlbk5hbWV9Lmxhc3RTYW1wbGVcbiAgaWYoICR7dGhpcy5uYW1lfV9kaWZmIDwgLS41ICkgJHt0aGlzLm5hbWV9X2RpZmYgKz0gMVxuICAke2dlbk5hbWV9LnBoYXNlICs9ICR7dGhpcy5uYW1lfV9kaWZmICogJHtpbnB1dHNbMV19XG4gIGlmKCAke2dlbk5hbWV9LnBoYXNlID4gMSApICR7Z2VuTmFtZX0ucGhhc2UgLT0gMVxuICAke2dlbk5hbWV9Lmxhc3RTYW1wbGUgPSAke2lucHV0c1swXX1cbmBcbiAgICBvdXQgPSAnICcgKyBvdXRcblxuICAgIHJldHVybiBbIGdlbk5hbWUgKyAnLnBoYXNlJywgb3V0IF1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW4xLCByYXRlICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7IFxuICAgIHBoYXNlOiAgICAgIDAsXG4gICAgbGFzdFNhbXBsZTogMCxcbiAgICB1aWQ6ICAgICAgICBnZW4uZ2V0VUlEKCksXG4gICAgaW5wdXRzOiAgICAgWyBpbjEsIHJhdGUgXSxcbiAgfSlcbiAgXG4gIHVnZW4ubmFtZSA9IGAke3VnZW4uYmFzZW5hbWV9JHt1Z2VuLnVpZH1gXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBuYW1lOidyb3VuZCcsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuXG4gICAgXG4gICAgY29uc3QgaXNXb3JrbGV0ID0gZ2VuLm1vZGUgPT09ICd3b3JrbGV0J1xuICAgIGNvbnN0IHJlZiA9IGlzV29ya2xldD8gJycgOiAnZ2VuLidcblxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICBnZW4uY2xvc3VyZXMuYWRkKHsgWyB0aGlzLm5hbWUgXTogaXNXb3JrbGV0ID8gJ01hdGgucm91bmQnIDogTWF0aC5yb3VuZCB9KVxuXG4gICAgICBvdXQgPSBgJHtyZWZ9cm91bmQoICR7aW5wdXRzWzBdfSApYFxuXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IE1hdGgucm91bmQoIHBhcnNlRmxvYXQoIGlucHV0c1swXSApIClcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geCA9PiB7XG4gIGxldCByb3VuZCA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICByb3VuZC5pbnB1dHMgPSBbIHggXVxuXG4gIHJldHVybiByb3VuZFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gICAgID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J3NhaCcsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksIG91dFxuXG4gICAgLy9nZW4uZGF0YVsgdGhpcy5uYW1lIF0gPSAwXG4gICAgLy9nZW4uZGF0YVsgdGhpcy5uYW1lICsgJ19jb250cm9sJyBdID0gMFxuXG4gICAgZ2VuLnJlcXVlc3RNZW1vcnkoIHRoaXMubWVtb3J5IClcblxuXG4gICAgb3V0ID0gXG5gIHZhciAke3RoaXMubmFtZX1fY29udHJvbCA9IG1lbW9yeVske3RoaXMubWVtb3J5LmNvbnRyb2wuaWR4fV0sXG4gICAgICAke3RoaXMubmFtZX1fdHJpZ2dlciA9ICR7aW5wdXRzWzFdfSA+ICR7aW5wdXRzWzJdfSA/IDEgOiAwXG5cbiAgaWYoICR7dGhpcy5uYW1lfV90cmlnZ2VyICE9PSAke3RoaXMubmFtZX1fY29udHJvbCAgKSB7XG4gICAgaWYoICR7dGhpcy5uYW1lfV90cmlnZ2VyID09PSAxICkgXG4gICAgICBtZW1vcnlbJHt0aGlzLm1lbW9yeS52YWx1ZS5pZHh9XSA9ICR7aW5wdXRzWzBdfVxuICAgIFxuICAgIG1lbW9yeVske3RoaXMubWVtb3J5LmNvbnRyb2wuaWR4fV0gPSAke3RoaXMubmFtZX1fdHJpZ2dlclxuICB9XG5gXG4gICAgXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gYG1lbW9yeVske3RoaXMubWVtb3J5LnZhbHVlLmlkeH1dYC8vYGdlbi5kYXRhLiR7dGhpcy5uYW1lfWBcblxuICAgIHJldHVybiBbIGBtZW1vcnlbJHt0aGlzLm1lbW9yeS52YWx1ZS5pZHh9XWAsICcgJyArb3V0IF1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW4xLCBjb250cm9sLCB0aHJlc2hvbGQ9MCwgcHJvcGVydGllcyApID0+IHtcbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApLFxuICAgICAgZGVmYXVsdHMgPSB7IGluaXQ6MCB9XG5cbiAgaWYoIHByb3BlcnRpZXMgIT09IHVuZGVmaW5lZCApIE9iamVjdC5hc3NpZ24oIGRlZmF1bHRzLCBwcm9wZXJ0aWVzIClcblxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7IFxuICAgIGxhc3RTYW1wbGU6IDAsXG4gICAgdWlkOiAgICAgICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogICAgIFsgaW4xLCBjb250cm9sLHRocmVzaG9sZCBdLFxuICAgIG1lbW9yeToge1xuICAgICAgY29udHJvbDogeyBpZHg6bnVsbCwgbGVuZ3RoOjEgfSxcbiAgICAgIHZhbHVlOiAgIHsgaWR4Om51bGwsIGxlbmd0aDoxIH0sXG4gICAgfVxuICB9LFxuICBkZWZhdWx0cyApXG4gIFxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7dWdlbi51aWR9YFxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiA9IHJlcXVpcmUoICcuL2dlbi5qcycgKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidzZWxlY3RvcicsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksIG91dCwgcmV0dXJuVmFsdWUgPSAwXG4gICAgXG4gICAgc3dpdGNoKCBpbnB1dHMubGVuZ3RoICkge1xuICAgICAgY2FzZSAyIDpcbiAgICAgICAgcmV0dXJuVmFsdWUgPSBpbnB1dHNbMV1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDMgOlxuICAgICAgICBvdXQgPSBgICB2YXIgJHt0aGlzLm5hbWV9X291dCA9ICR7aW5wdXRzWzBdfSA9PT0gMSA/ICR7aW5wdXRzWzFdfSA6ICR7aW5wdXRzWzJdfVxcblxcbmA7XG4gICAgICAgIHJldHVyblZhbHVlID0gWyB0aGlzLm5hbWUgKyAnX291dCcsIG91dCBdXG4gICAgICAgIGJyZWFrOyAgXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBvdXQgPSBcbmAgdmFyICR7dGhpcy5uYW1lfV9vdXQgPSAwXG4gIHN3aXRjaCggJHtpbnB1dHNbMF19ICsgMSApIHtcXG5gXG5cbiAgICAgICAgZm9yKCBsZXQgaSA9IDE7IGkgPCBpbnB1dHMubGVuZ3RoOyBpKysgKXtcbiAgICAgICAgICBvdXQgKz1gICAgIGNhc2UgJHtpfTogJHt0aGlzLm5hbWV9X291dCA9ICR7aW5wdXRzW2ldfTsgYnJlYWs7XFxuYCBcbiAgICAgICAgfVxuXG4gICAgICAgIG91dCArPSAnICB9XFxuXFxuJ1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuVmFsdWUgPSBbIHRoaXMubmFtZSArICdfb3V0JywgJyAnICsgb3V0IF1cbiAgICB9XG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWUgKyAnX291dCdcblxuICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICB9LFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggLi4uaW5wdXRzICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcbiAgXG4gIE9iamVjdC5hc3NpZ24oIHVnZW4sIHtcbiAgICB1aWQ6ICAgICBnZW4uZ2V0VUlEKCksXG4gICAgaW5wdXRzXG4gIH0pXG4gIFxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7dWdlbi51aWR9YFxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApLFxuICAgIGFjY3VtID0gcmVxdWlyZSggJy4vYWNjdW0uanMnICksXG4gICAgY291bnRlcj0gcmVxdWlyZSggJy4vY291bnRlci5qcycgKSxcbiAgICBwZWVrICA9IHJlcXVpcmUoICcuL3BlZWsuanMnICksXG4gICAgc3NkICAgPSByZXF1aXJlKCAnLi9oaXN0b3J5LmpzJyApLFxuICAgIGRhdGEgID0gcmVxdWlyZSggJy4vZGF0YS5qcycgKSxcbiAgICBwcm90byA9IHsgYmFzZW5hbWU6J3NlcScgfVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggZHVyYXRpb25zID0gMTEwMjUsIHZhbHVlcyA9IFswLDFdLCBwaGFzZUluY3JlbWVudCA9IDEpID0+IHtcbiAgbGV0IGNsb2NrXG4gIFxuICBpZiggQXJyYXkuaXNBcnJheSggZHVyYXRpb25zICkgKSB7XG4gICAgLy8gd2Ugd2FudCBhIGNvdW50ZXIgdGhhdCBpcyB1c2luZyBvdXIgY3VycmVudFxuICAgIC8vIHJhdGUgdmFsdWUsIGJ1dCB3ZSB3YW50IHRoZSByYXRlIHZhbHVlIHRvIGJlIGRlcml2ZWQgZnJvbVxuICAgIC8vIHRoZSBjb3VudGVyLiBtdXN0IGluc2VydCBhIHNpbmdsZS1zYW1wbGUgZGVhbHkgdG8gYXZvaWRcbiAgICAvLyBpbmZpbml0ZSBsb29wLlxuICAgIGNvbnN0IGNsb2NrMiA9IGNvdW50ZXIoIDAsIDAsIGR1cmF0aW9ucy5sZW5ndGggKVxuICAgIGNvbnN0IF9fZHVyYXRpb25zID0gcGVlayggZGF0YSggZHVyYXRpb25zICksIGNsb2NrMiwgeyBtb2RlOidzaW1wbGUnIH0pIFxuICAgIGNsb2NrID0gY291bnRlciggcGhhc2VJbmNyZW1lbnQsIDAsIF9fZHVyYXRpb25zIClcbiAgICBcbiAgICAvLyBhZGQgb25lIHNhbXBsZSBkZWxheSB0byBhdm9pZCBjb2RlZ2VuIGxvb3BcbiAgICBjb25zdCBzID0gc3NkKClcbiAgICBzLmluKCBjbG9jay53cmFwIClcbiAgICBjbG9jazIuaW5wdXRzWzBdID0gcy5vdXRcbiAgfWVsc2V7XG4gICAgLy8gaWYgdGhlIHJhdGUgYXJndW1lbnQgaXMgYSBzaW5nbGUgdmFsdWUgd2UgZG9uJ3QgbmVlZCB0b1xuICAgIC8vIGRvIGFueXRoaW5nIHRyaWNreS5cbiAgICBjbG9jayA9IGNvdW50ZXIoIHBoYXNlSW5jcmVtZW50LCAwLCBkdXJhdGlvbnMgKVxuICB9XG4gIFxuICBjb25zdCBzdGVwcGVyID0gYWNjdW0oIGNsb2NrLndyYXAsIDAsIHsgbWluOjAsIG1heDp2YWx1ZXMubGVuZ3RoIH0pXG4gICBcbiAgY29uc3QgdWdlbiA9IHBlZWsoIGRhdGEoIHZhbHVlcyApLCBzdGVwcGVyLCB7IG1vZGU6J3NpbXBsZScgfSlcblxuICB1Z2VuLm5hbWUgPSBwcm90by5iYXNlbmFtZSArIGdlbi5nZXRVSUQoKVxuICB1Z2VuLnRyaWdnZXIgPSBjbG9jay53cmFwXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBuYW1lOidzaWduJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG5cbiAgICBcbiAgICBjb25zdCBpc1dvcmtsZXQgPSBnZW4ubW9kZSA9PT0gJ3dvcmtsZXQnXG4gICAgY29uc3QgcmVmID0gaXNXb3JrbGV0PyAnJyA6ICdnZW4uJ1xuXG4gICAgaWYoIGlzTmFOKCBpbnB1dHNbMF0gKSApIHtcbiAgICAgIGdlbi5jbG9zdXJlcy5hZGQoeyBbIHRoaXMubmFtZSBdOiBpc1dvcmtsZXQgPyAnTWF0aC5zaWduJyA6IE1hdGguc2lnbiB9KVxuXG4gICAgICBvdXQgPSBgJHtyZWZ9c2lnbiggJHtpbnB1dHNbMF19IClgXG5cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gTWF0aC5zaWduKCBwYXJzZUZsb2F0KCBpbnB1dHNbMF0gKSApXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHggPT4ge1xuICBsZXQgc2lnbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBzaWduLmlucHV0cyA9IFsgeCBdXG5cbiAgcmV0dXJuIHNpZ25cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonc2luJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG4gICAgXG4gICAgXG4gICAgY29uc3QgaXNXb3JrbGV0ID0gZ2VuLm1vZGUgPT09ICd3b3JrbGV0J1xuICAgIGNvbnN0IHJlZiA9IGlzV29ya2xldD8gJycgOiAnZ2VuLidcblxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICBnZW4uY2xvc3VyZXMuYWRkKHsgJ3Npbic6IGlzV29ya2xldCA/ICdNYXRoLnNpbicgOiBNYXRoLnNpbiB9KVxuXG4gICAgICBvdXQgPSBgJHtyZWZ9c2luKCAke2lucHV0c1swXX0gKWAgXG5cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gTWF0aC5zaW4oIHBhcnNlRmxvYXQoIGlucHV0c1swXSApIClcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geCA9PiB7XG4gIGxldCBzaW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgc2luLmlucHV0cyA9IFsgeCBdXG4gIHNpbi5pZCA9IGdlbi5nZXRVSUQoKVxuICBzaW4ubmFtZSA9IGAke3Npbi5iYXNlbmFtZX17c2luLmlkfWBcblxuICByZXR1cm4gc2luXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgICAgPSByZXF1aXJlKCAnLi9nZW4uanMnICksXG4gICAgaGlzdG9yeSA9IHJlcXVpcmUoICcuL2hpc3RvcnkuanMnICksXG4gICAgc3ViICAgICA9IHJlcXVpcmUoICcuL3N1Yi5qcycgKSxcbiAgICBhZGQgICAgID0gcmVxdWlyZSggJy4vYWRkLmpzJyApLFxuICAgIG11bCAgICAgPSByZXF1aXJlKCAnLi9tdWwuanMnICksXG4gICAgbWVtbyAgICA9IHJlcXVpcmUoICcuL21lbW8uanMnICksXG4gICAgZ3QgICAgICA9IHJlcXVpcmUoICcuL2d0LmpzJyApLFxuICAgIGRpdiAgICAgPSByZXF1aXJlKCAnLi9kaXYuanMnICksXG4gICAgX3N3aXRjaCA9IHJlcXVpcmUoICcuL3N3aXRjaC5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW4xLCBzbGlkZVVwID0gMSwgc2xpZGVEb3duID0gMSApID0+IHtcbiAgbGV0IHkxID0gaGlzdG9yeSgwKSxcbiAgICAgIGZpbHRlciwgc2xpZGVBbW91bnRcblxuICAvL3kgKG4pID0geSAobi0xKSArICgoeCAobikgLSB5IChuLTEpKS9zbGlkZSkgXG4gIHNsaWRlQW1vdW50ID0gX3N3aXRjaCggZ3QoaW4xLHkxLm91dCksIHNsaWRlVXAsIHNsaWRlRG93biApXG5cbiAgZmlsdGVyID0gbWVtbyggYWRkKCB5MS5vdXQsIGRpdiggc3ViKCBpbjEsIHkxLm91dCApLCBzbGlkZUFtb3VudCApICkgKVxuXG4gIHkxLmluKCBmaWx0ZXIgKVxuXG4gIHJldHVybiBmaWx0ZXJcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBnZW4gPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmNvbnN0IHByb3RvID0ge1xuICBiYXNlbmFtZTonc3ViJyxcbiAgZ2VuKCkge1xuICAgIGxldCBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksXG4gICAgICAgIG91dD0wLFxuICAgICAgICBkaWZmID0gMCxcbiAgICAgICAgbmVlZHNQYXJlbnMgPSBmYWxzZSwgXG4gICAgICAgIG51bUNvdW50ID0gMCxcbiAgICAgICAgbGFzdE51bWJlciA9IGlucHV0c1sgMCBdLFxuICAgICAgICBsYXN0TnVtYmVySXNVZ2VuID0gaXNOYU4oIGxhc3ROdW1iZXIgKSwgXG4gICAgICAgIHN1YkF0RW5kID0gZmFsc2UsXG4gICAgICAgIGhhc1VnZW5zID0gZmFsc2UsXG4gICAgICAgIHJldHVyblZhbHVlID0gMFxuXG4gICAgdGhpcy5pbnB1dHMuZm9yRWFjaCggdmFsdWUgPT4geyBpZiggaXNOYU4oIHZhbHVlICkgKSBoYXNVZ2VucyA9IHRydWUgfSlcblxuICAgIG91dCA9ICcgIHZhciAnICsgdGhpcy5uYW1lICsgJyA9ICdcblxuICAgIGlucHV0cy5mb3JFYWNoKCAodixpKSA9PiB7XG4gICAgICBpZiggaSA9PT0gMCApIHJldHVyblxuXG4gICAgICBsZXQgaXNOdW1iZXJVZ2VuID0gaXNOYU4oIHYgKSxcbiAgICAgICAgICBpc0ZpbmFsSWR4ICAgPSBpID09PSBpbnB1dHMubGVuZ3RoIC0gMVxuXG4gICAgICBpZiggIWxhc3ROdW1iZXJJc1VnZW4gJiYgIWlzTnVtYmVyVWdlbiApIHtcbiAgICAgICAgbGFzdE51bWJlciA9IGxhc3ROdW1iZXIgLSB2XG4gICAgICAgIG91dCArPSBsYXN0TnVtYmVyXG4gICAgICAgIHJldHVyblxuICAgICAgfWVsc2V7XG4gICAgICAgIG5lZWRzUGFyZW5zID0gdHJ1ZVxuICAgICAgICBvdXQgKz0gYCR7bGFzdE51bWJlcn0gLSAke3Z9YFxuICAgICAgfVxuXG4gICAgICBpZiggIWlzRmluYWxJZHggKSBvdXQgKz0gJyAtICcgXG4gICAgfSlcblxuICAgIG91dCArPSAnXFxuJ1xuXG4gICAgcmV0dXJuVmFsdWUgPSBbIHRoaXMubmFtZSwgb3V0IF1cblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IHRoaXMubmFtZVxuXG4gICAgcmV0dXJuIHJldHVyblZhbHVlXG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggLi4uYXJncyApID0+IHtcbiAgbGV0IHN1YiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBPYmplY3QuYXNzaWduKCBzdWIsIHtcbiAgICBpZDogICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6IGFyZ3NcbiAgfSlcbiAgICAgICBcbiAgc3ViLm5hbWUgPSAnc3ViJyArIHN1Yi5pZFxuXG4gIHJldHVybiBzdWJcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J3N3aXRjaCcsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksIG91dFxuXG4gICAgaWYoIGlucHV0c1sxXSA9PT0gaW5wdXRzWzJdICkgcmV0dXJuIGlucHV0c1sxXSAvLyBpZiBib3RoIHBvdGVudGlhbCBvdXRwdXRzIGFyZSB0aGUgc2FtZSBqdXN0IHJldHVybiBvbmUgb2YgdGhlbVxuICAgIFxuICAgIG91dCA9IGAgIHZhciAke3RoaXMubmFtZX1fb3V0ID0gJHtpbnB1dHNbMF19ID09PSAxID8gJHtpbnB1dHNbMV19IDogJHtpbnB1dHNbMl19XFxuYFxuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gYCR7dGhpcy5uYW1lfV9vdXRgXG5cbiAgICByZXR1cm4gWyBgJHt0aGlzLm5hbWV9X291dGAsIG91dCBdXG4gIH0sXG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIGNvbnRyb2wsIGluMSA9IDEsIGluMiA9IDAgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7XG4gICAgdWlkOiAgICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogIFsgY29udHJvbCwgaW4xLCBpbjIgXSxcbiAgfSlcbiAgXG4gIHVnZW4ubmFtZSA9IGAke3VnZW4uYmFzZW5hbWV9JHt1Z2VuLnVpZH1gXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTondDYwJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApLFxuICAgICAgICByZXR1cm5WYWx1ZVxuXG4gICAgY29uc3QgaXNXb3JrbGV0ID0gZ2VuLm1vZGUgPT09ICd3b3JrbGV0J1xuICAgIGNvbnN0IHJlZiA9IGlzV29ya2xldD8gJycgOiAnZ2VuLidcblxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICBnZW4uY2xvc3VyZXMuYWRkKHsgWyAnZXhwJyBdOiBpc1dvcmtsZXQgPyAnTWF0aC5leHAnIDogTWF0aC5leHAgfSlcblxuICAgICAgb3V0ID0gYCAgdmFyICR7dGhpcy5uYW1lfSA9ICR7cmVmfWV4cCggLTYuOTA3NzU1Mjc4OTIxIC8gJHtpbnB1dHNbMF19IClcXG5cXG5gXG4gICAgIFxuICAgICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gb3V0XG4gICAgICBcbiAgICAgIHJldHVyblZhbHVlID0gWyB0aGlzLm5hbWUsIG91dCBdXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IE1hdGguZXhwKCAtNi45MDc3NTUyNzg5MjEgLyBpbnB1dHNbMF0gKVxuXG4gICAgICByZXR1cm5WYWx1ZSA9IG91dFxuICAgIH0gICAgXG5cbiAgICByZXR1cm4gcmV0dXJuVmFsdWVcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHggPT4ge1xuICBsZXQgdDYwID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIHQ2MC5pbnB1dHMgPSBbIHggXVxuICB0NjAubmFtZSA9IHByb3RvLmJhc2VuYW1lICsgZ2VuLmdldFVJRCgpXG5cbiAgcmV0dXJuIHQ2MFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOid0YW4nLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcbiAgICBcbiAgICBcbiAgICBjb25zdCBpc1dvcmtsZXQgPSBnZW4ubW9kZSA9PT0gJ3dvcmtsZXQnXG4gICAgY29uc3QgcmVmID0gaXNXb3JrbGV0PyAnJyA6ICdnZW4uJ1xuXG4gICAgaWYoIGlzTmFOKCBpbnB1dHNbMF0gKSApIHtcbiAgICAgIGdlbi5jbG9zdXJlcy5hZGQoeyAndGFuJzogaXNXb3JrbGV0ID8gJ01hdGgudGFuJyA6IE1hdGgudGFuIH0pXG5cbiAgICAgIG91dCA9IGAke3JlZn10YW4oICR7aW5wdXRzWzBdfSApYCBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLnRhbiggcGFyc2VGbG9hdCggaW5wdXRzWzBdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IHRhbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICB0YW4uaW5wdXRzID0gWyB4IF1cbiAgdGFuLmlkID0gZ2VuLmdldFVJRCgpXG4gIHRhbi5uYW1lID0gYCR7dGFuLmJhc2VuYW1lfXt0YW4uaWR9YFxuXG4gIHJldHVybiB0YW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTondGFuaCcsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuICAgIFxuICAgIFxuICAgIGNvbnN0IGlzV29ya2xldCA9IGdlbi5tb2RlID09PSAnd29ya2xldCdcbiAgICBjb25zdCByZWYgPSBpc1dvcmtsZXQ/ICcnIDogJ2dlbi4nXG5cbiAgICBpZiggaXNOYU4oIGlucHV0c1swXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7ICd0YW5oJzogaXNXb3JrbGV0ID8gJ01hdGgudGFuJyA6IE1hdGgudGFuaCB9KVxuXG4gICAgICBvdXQgPSBgJHtyZWZ9dGFuaCggJHtpbnB1dHNbMF19IClgIFxuXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IE1hdGgudGFuaCggcGFyc2VGbG9hdCggaW5wdXRzWzBdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IHRhbmggPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgdGFuaC5pbnB1dHMgPSBbIHggXVxuICB0YW5oLmlkID0gZ2VuLmdldFVJRCgpXG4gIHRhbmgubmFtZSA9IGAke3RhbmguYmFzZW5hbWV9e3RhbmguaWR9YFxuXG4gIHJldHVybiB0YW5oXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgICAgPSByZXF1aXJlKCAnLi9nZW4uanMnICksXG4gICAgbHQgICAgICA9IHJlcXVpcmUoICcuL2x0LmpzJyApLFxuICAgIGFjY3VtICAgPSByZXF1aXJlKCAnLi9hY2N1bS5qcycgKSxcbiAgICBkaXYgICAgID0gcmVxdWlyZSggJy4vZGl2LmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gKCBmcmVxdWVuY3k9NDQwLCBwdWxzZXdpZHRoPS41ICkgPT4ge1xuICBsZXQgZ3JhcGggPSBsdCggYWNjdW0oIGRpdiggZnJlcXVlbmN5LCA0NDEwMCApICksIHB1bHNld2lkdGggKVxuXG4gIGdyYXBoLm5hbWUgPSBgdHJhaW4ke2dlbi5nZXRVSUQoKX1gXG5cbiAgcmV0dXJuIGdyYXBoXG59XG5cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBBV1BGID0gcmVxdWlyZSggJy4vZXh0ZXJuYWwvYXVkaW93b3JrbGV0LXBvbHlmaWxsLmpzJyApLFxuICAgICAgZ2VuICA9IHJlcXVpcmUoICcuL2dlbi5qcycgKSxcbiAgICAgIGRhdGEgPSByZXF1aXJlKCAnLi9kYXRhLmpzJyApXG5cbmxldCBpc1N0ZXJlbyA9IGZhbHNlXG5cbmNvbnN0IHV0aWxpdGllcyA9IHtcbiAgY3R4OiBudWxsLFxuICBidWZmZXJzOiB7fSxcbiAgaXNTdGVyZW86ZmFsc2UsXG5cbiAgY2xlYXIoKSB7XG4gICAgaWYoIHRoaXMud29ya2xldE5vZGUgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgIHRoaXMud29ya2xldE5vZGUuZGlzY29ubmVjdCgpXG4gICAgfWVsc2V7XG4gICAgICB0aGlzLmNhbGxiYWNrID0gKCkgPT4gMFxuICAgIH1cbiAgICB0aGlzLmNsZWFyLmNhbGxiYWNrcy5mb3JFYWNoKCB2ID0+IHYoKSApXG4gICAgdGhpcy5jbGVhci5jYWxsYmFja3MubGVuZ3RoID0gMFxuXG4gICAgdGhpcy5pc1N0ZXJlbyA9IGZhbHNlXG5cbiAgICBpZiggZ2VuLmdyYXBoICE9PSBudWxsICkgZ2VuLmZyZWUoIGdlbi5ncmFwaCApXG4gIH0sXG5cbiAgY3JlYXRlQ29udGV4dCggYnVmZmVyU2l6ZSA9IDIwNDggKSB7XG4gICAgY29uc3QgQUMgPSB0eXBlb2YgQXVkaW9Db250ZXh0ID09PSAndW5kZWZpbmVkJyA/IHdlYmtpdEF1ZGlvQ29udGV4dCA6IEF1ZGlvQ29udGV4dFxuICAgIFxuICAgIC8vIHRlbGwgcG9seWZpbGwgZ2xvYmFsIG9iamVjdCBhbmQgYnVmZmVyc2l6ZVxuICAgIEFXUEYoIHdpbmRvdywgYnVmZmVyU2l6ZSApXG5cbiAgICBjb25zdCBzdGFydCA9ICgpID0+IHtcbiAgICAgIGlmKCB0eXBlb2YgQUMgIT09ICd1bmRlZmluZWQnICkge1xuICAgICAgICB0aGlzLmN0eCA9IG5ldyBBQyh7IGxhdGVuY3lIaW50Oi4wMTI1IH0pXG5cbiAgICAgICAgZ2VuLnNhbXBsZXJhdGUgPSB0aGlzLmN0eC5zYW1wbGVSYXRlXG5cbiAgICAgICAgaWYoIGRvY3VtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiAnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgKSB7XG4gICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICd0b3VjaHN0YXJ0Jywgc3RhcnQgKVxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ21vdXNlZG93bicsIHN0YXJ0IClcbiAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2tleWRvd24nLCBzdGFydCApXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBteVNvdXJjZSA9IHV0aWxpdGllcy5jdHguY3JlYXRlQnVmZmVyU291cmNlKClcbiAgICAgICAgbXlTb3VyY2UuY29ubmVjdCggdXRpbGl0aWVzLmN0eC5kZXN0aW5hdGlvbiApXG4gICAgICAgIG15U291cmNlLnN0YXJ0KClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiggZG9jdW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCApIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAndG91Y2hzdGFydCcsIHN0YXJ0IClcbiAgICB9ZWxzZXtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnbW91c2Vkb3duJywgc3RhcnQgKVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdrZXlkb3duJywgc3RhcnQgKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgY3JlYXRlU2NyaXB0UHJvY2Vzc29yKCkge1xuICAgIHRoaXMubm9kZSA9IHRoaXMuY3R4LmNyZWF0ZVNjcmlwdFByb2Nlc3NvciggMTAyNCwgMCwgMiApXG4gICAgdGhpcy5jbGVhckZ1bmN0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAwIH1cbiAgICBpZiggdHlwZW9mIHRoaXMuY2FsbGJhY2sgPT09ICd1bmRlZmluZWQnICkgdGhpcy5jYWxsYmFjayA9IHRoaXMuY2xlYXJGdW5jdGlvblxuXG4gICAgdGhpcy5ub2RlLm9uYXVkaW9wcm9jZXNzID0gZnVuY3Rpb24oIGF1ZGlvUHJvY2Vzc2luZ0V2ZW50ICkge1xuICAgICAgdmFyIG91dHB1dEJ1ZmZlciA9IGF1ZGlvUHJvY2Vzc2luZ0V2ZW50Lm91dHB1dEJ1ZmZlcjtcblxuICAgICAgdmFyIGxlZnQgPSBvdXRwdXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoIDAgKSxcbiAgICAgICAgICByaWdodD0gb3V0cHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKCAxICksXG4gICAgICAgICAgaXNTdGVyZW8gPSB1dGlsaXRpZXMuaXNTdGVyZW9cblxuICAgICBmb3IoIHZhciBzYW1wbGUgPSAwOyBzYW1wbGUgPCBsZWZ0Lmxlbmd0aDsgc2FtcGxlKysgKSB7XG4gICAgICAgIHZhciBvdXQgPSB1dGlsaXRpZXMuY2FsbGJhY2soKVxuXG4gICAgICAgIGlmKCBpc1N0ZXJlbyA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgbGVmdFsgc2FtcGxlIF0gPSByaWdodFsgc2FtcGxlIF0gPSBvdXQgXG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIGxlZnRbIHNhbXBsZSAgXSA9IG91dFswXVxuICAgICAgICAgIHJpZ2h0WyBzYW1wbGUgXSA9IG91dFsxXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5ub2RlLmNvbm5lY3QoIHRoaXMuY3R4LmRlc3RpbmF0aW9uIClcblxuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgLy8gcmVtb3ZlIHN0YXJ0aW5nIHN0dWZmIGFuZCBhZGQgdGFic1xuICBwcmV0dHlQcmludENhbGxiYWNrKCBjYiApIHtcbiAgICAvLyBnZXQgcmlkIG9mIFwiZnVuY3Rpb24gZ2VuXCIgYW5kIHN0YXJ0IHdpdGggcGFyZW50aGVzaXNcbiAgICAvLyBjb25zdCBzaG9ydGVuZENCID0gY2IudG9TdHJpbmcoKS5zbGljZSg5KVxuICAgIGNvbnN0IGNiU3BsaXQgPSBjYi50b1N0cmluZygpLnNwbGl0KCdcXG4nKVxuICAgIGNvbnN0IGNiVHJpbSA9IGNiU3BsaXQuc2xpY2UoIDMsIC0yIClcbiAgICBjb25zdCBjYlRhYmJlZCA9IGNiVHJpbS5tYXAoIHYgPT4gJyAgICAgICcgKyB2ICkgXG4gICAgXG4gICAgcmV0dXJuIGNiVGFiYmVkLmpvaW4oJ1xcbicpXG4gIH0sXG5cbiAgY3JlYXRlUGFyYW1ldGVyRGVzY3JpcHRvcnMoIGNiICkge1xuICAgIC8vIFt7bmFtZTogJ2FtcGxpdHVkZScsIGRlZmF1bHRWYWx1ZTogMC4yNSwgbWluVmFsdWU6IDAsIG1heFZhbHVlOiAxfV07XG4gICAgbGV0IHBhcmFtU3RyID0gJydcblxuICAgIC8vZm9yKCBsZXQgdWdlbiBvZiBjYi5wYXJhbXMudmFsdWVzKCkgKSB7XG4gICAgLy8gIHBhcmFtU3RyICs9IGB7IG5hbWU6JyR7dWdlbi5uYW1lfScsIGRlZmF1bHRWYWx1ZToke3VnZW4udmFsdWV9LCBtaW5WYWx1ZToke3VnZW4ubWlufSwgbWF4VmFsdWU6JHt1Z2VuLm1heH0gfSxcXG4gICAgICBgXG4gICAgLy99XG4gICAgZm9yKCBsZXQgdWdlbiBvZiBjYi5wYXJhbXMudmFsdWVzKCkgKSB7XG4gICAgICBwYXJhbVN0ciArPSBgeyBuYW1lOicke3VnZW4ubmFtZX0nLCBhdXRvbWF0aW9uUmF0ZTonay1yYXRlJywgZGVmYXVsdFZhbHVlOiR7dWdlbi5kZWZhdWx0VmFsdWV9LCBtaW5WYWx1ZToke3VnZW4ubWlufSwgbWF4VmFsdWU6JHt1Z2VuLm1heH0gfSxcXG4gICAgICBgXG4gICAgfVxuICAgIHJldHVybiBwYXJhbVN0clxuICB9LFxuXG4gIGNyZWF0ZVBhcmFtZXRlckRlcmVmZXJlbmNlcyggY2IgKSB7XG4gICAgbGV0IHN0ciA9IGNiLnBhcmFtcy5zaXplID4gMCA/ICdcXG4gICAgICAnIDogJydcbiAgICBmb3IoIGxldCB1Z2VuIG9mIGNiLnBhcmFtcy52YWx1ZXMoKSApIHtcbiAgICAgIHN0ciArPSBgY29uc3QgJHt1Z2VuLm5hbWV9ID0gcGFyYW1ldGVycy4ke3VnZW4ubmFtZX1bMF1cXG4gICAgICBgXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0clxuICB9LFxuXG4gIGNyZWF0ZVBhcmFtZXRlckFyZ3VtZW50cyggY2IgKSB7XG4gICAgbGV0ICBwYXJhbUxpc3QgPSAnJ1xuICAgIGZvciggbGV0IHVnZW4gb2YgY2IucGFyYW1zLnZhbHVlcygpICkge1xuICAgICAgcGFyYW1MaXN0ICs9IHVnZW4ubmFtZSArICdbaV0sJ1xuICAgIH1cbiAgICBwYXJhbUxpc3QgPSBwYXJhbUxpc3Quc2xpY2UoIDAsIC0xIClcblxuICAgIHJldHVybiBwYXJhbUxpc3RcbiAgfSxcblxuICBjcmVhdGVJbnB1dERlcmVmZXJlbmNlcyggY2IgKSB7XG4gICAgbGV0IHN0ciA9IGNiLmlucHV0cy5zaXplID4gMCA/ICdcXG4nIDogJydcbiAgICBmb3IoIGxldCBpbnB1dCBvZiAgY2IuaW5wdXRzLnZhbHVlcygpICkge1xuICAgICAgc3RyICs9IGBjb25zdCAke2lucHV0Lm5hbWV9ID0gaW5wdXRzWyAke2lucHV0LmlucHV0TnVtYmVyfSBdWyAke2lucHV0LmNoYW5uZWxOdW1iZXJ9IF1cXG4gICAgICBgXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0clxuICB9LFxuXG5cbiAgY3JlYXRlSW5wdXRBcmd1bWVudHMoIGNiICkge1xuICAgIGxldCAgcGFyYW1MaXN0ID0gJydcbiAgICBmb3IoIGxldCBpbnB1dCBvZiBjYi5pbnB1dHMudmFsdWVzKCkgKSB7XG4gICAgICBwYXJhbUxpc3QgKz0gaW5wdXQubmFtZSArICdbaV0sJ1xuICAgIH1cbiAgICBwYXJhbUxpc3QgPSBwYXJhbUxpc3Quc2xpY2UoIDAsIC0xIClcblxuICAgIHJldHVybiBwYXJhbUxpc3RcbiAgfSxcbiAgICAgIFxuICBjcmVhdGVGdW5jdGlvbkRlcmVmZXJlbmNlcyggY2IgKSB7XG4gICAgbGV0IG1lbWJlclN0cmluZyA9IGNiLm1lbWJlcnMuc2l6ZSA+IDAgPyAnXFxuJyA6ICcnXG4gICAgbGV0IG1lbW8gPSB7fVxuICAgIGZvciggbGV0IGRpY3Qgb2YgY2IubWVtYmVycy52YWx1ZXMoKSApIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBPYmplY3Qua2V5cyggZGljdCApWzBdLFxuICAgICAgICAgICAgdmFsdWUgPSBkaWN0WyBuYW1lIF1cblxuICAgICAgaWYoIG1lbW9bIG5hbWUgXSAhPT0gdW5kZWZpbmVkICkgY29udGludWVcbiAgICAgIG1lbW9bIG5hbWUgXSA9IHRydWVcblxuICAgICAgbWVtYmVyU3RyaW5nICs9IGAgICAgICBjb25zdCAke25hbWV9ID0gJHt2YWx1ZX1cXG5gXG4gICAgfVxuXG4gICAgcmV0dXJuIG1lbWJlclN0cmluZ1xuICB9LFxuXG4gIGNyZWF0ZVdvcmtsZXRQcm9jZXNzb3IoIGdyYXBoLCBuYW1lLCBkZWJ1ZywgbWVtPTQ0MTAwKjEwICkge1xuICAgIC8vY29uc3QgbWVtID0gTWVtb3J5SGVscGVyLmNyZWF0ZSggNDA5NiwgRmxvYXQ2NEFycmF5IClcbiAgICBjb25zdCBjYiA9IGdlbi5jcmVhdGVDYWxsYmFjayggZ3JhcGgsIG1lbSwgZGVidWcgKVxuICAgIGNvbnN0IGlucHV0cyA9IGNiLmlucHV0c1xuXG4gICAgLy8gZ2V0IGFsbCBpbnB1dHMgYW5kIGNyZWF0ZSBhcHByb3ByaWF0ZSBhdWRpb3BhcmFtIGluaXRpYWxpemVyc1xuICAgIGNvbnN0IHBhcmFtZXRlckRlc2NyaXB0b3JzID0gdGhpcy5jcmVhdGVQYXJhbWV0ZXJEZXNjcmlwdG9ycyggY2IgKVxuICAgIGNvbnN0IHBhcmFtZXRlckRlcmVmZXJlbmNlcyA9IHRoaXMuY3JlYXRlUGFyYW1ldGVyRGVyZWZlcmVuY2VzKCBjYiApXG4gICAgY29uc3QgcGFyYW1MaXN0ID0gdGhpcy5jcmVhdGVQYXJhbWV0ZXJBcmd1bWVudHMoIGNiIClcbiAgICBjb25zdCBpbnB1dERlcmVmZXJlbmNlcyA9IHRoaXMuY3JlYXRlSW5wdXREZXJlZmVyZW5jZXMoIGNiIClcbiAgICBjb25zdCBpbnB1dExpc3QgPSB0aGlzLmNyZWF0ZUlucHV0QXJndW1lbnRzKCBjYiApICAgXG4gICAgY29uc3QgbWVtYmVyU3RyaW5nID0gdGhpcy5jcmVhdGVGdW5jdGlvbkRlcmVmZXJlbmNlcyggY2IgKVxuXG4gICAgLy8gY2hhbmdlIG91dHB1dCBiYXNlZCBvbiBudW1iZXIgb2YgY2hhbm5lbHMuXG4gICAgY29uc3QgZ2VuaXNoT3V0cHV0TGluZSA9IGNiLmlzU3RlcmVvID09PSBmYWxzZVxuICAgICAgPyBgbGVmdFsgaSBdID0gbWVtb3J5WzBdYFxuICAgICAgOiBgbGVmdFsgaSBdID0gbWVtb3J5WzBdO1xcblxcdFxcdHJpZ2h0WyBpIF0gPSBtZW1vcnlbMV1cXG5gXG5cbiAgICBjb25zdCBwcmV0dHlDYWxsYmFjayA9IHRoaXMucHJldHR5UHJpbnRDYWxsYmFjayggY2IgKVxuXG4gICAgLyoqKioqIGJlZ2luIGNhbGxiYWNrIGNvZGUgKioqKi9cbiAgICAvLyBub3RlIHRoYXQgd2UgaGF2ZSB0byBjaGVjayB0byBzZWUgdGhhdCBtZW1vcnkgaGFzIGJlZW4gcGFzc2VkXG4gICAgLy8gdG8gdGhlIHdvcmtlciBiZWZvcmUgcnVubmluZyB0aGUgY2FsbGJhY2sgZnVuY3Rpb24sIG90aGVyd2lzZVxuICAgIC8vIGl0IGNhbiBiZSBwYXNzZWQgdG9vIHNsb3dseSBhbmQgZmFpbCBvbiBvY2Nhc3Npb25cblxuICAgIGNvbnN0IHdvcmtsZXRDb2RlID0gYFxuY2xhc3MgJHtuYW1lfVByb2Nlc3NvciBleHRlbmRzIEF1ZGlvV29ya2xldFByb2Nlc3NvciB7XG5cbiAgc3RhdGljIGdldCBwYXJhbWV0ZXJEZXNjcmlwdG9ycygpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBbXG4gICAgICAkeyBwYXJhbWV0ZXJEZXNjcmlwdG9ycyB9ICAgICAgXG4gICAgXVxuICAgIHJldHVybiBwYXJhbXNcbiAgfVxuIFxuICBjb25zdHJ1Y3Rvciggb3B0aW9ucyApIHtcbiAgICBzdXBlciggb3B0aW9ucyApXG4gICAgdGhpcy5wb3J0Lm9ubWVzc2FnZSA9IHRoaXMuaGFuZGxlTWVzc2FnZS5iaW5kKCB0aGlzIClcbiAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2VcbiAgfVxuXG4gIGhhbmRsZU1lc3NhZ2UoIGV2ZW50ICkge1xuICAgIGlmKCBldmVudC5kYXRhLmtleSA9PT0gJ2luaXQnICkge1xuICAgICAgdGhpcy5tZW1vcnkgPSBldmVudC5kYXRhLm1lbW9yeVxuICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWVcbiAgICB9ZWxzZSBpZiggZXZlbnQuZGF0YS5rZXkgPT09ICdzZXQnICkge1xuICAgICAgdGhpcy5tZW1vcnlbIGV2ZW50LmRhdGEuaWR4IF0gPSBldmVudC5kYXRhLnZhbHVlXG4gICAgfWVsc2UgaWYoIGV2ZW50LmRhdGEua2V5ID09PSAnZ2V0JyApIHtcbiAgICAgIHRoaXMucG9ydC5wb3N0TWVzc2FnZSh7IGtleToncmV0dXJuJywgaWR4OmV2ZW50LmRhdGEuaWR4LCB2YWx1ZTp0aGlzLm1lbW9yeVtldmVudC5kYXRhLmlkeF0gfSkgICAgIFxuICAgIH1cbiAgfVxuXG4gIHByb2Nlc3MoIGlucHV0cywgb3V0cHV0cywgcGFyYW1ldGVycyApIHtcbiAgICBpZiggdGhpcy5pbml0aWFsaXplZCA9PT0gdHJ1ZSApIHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IG91dHB1dHNbMF1cbiAgICAgIGNvbnN0IGxlZnQgICA9IG91dHB1dFsgMCBdXG4gICAgICBjb25zdCByaWdodCAgPSBvdXRwdXRbIDEgXVxuICAgICAgY29uc3QgbGVuICAgID0gbGVmdC5sZW5ndGhcbiAgICAgIGNvbnN0IG1lbW9yeSA9IHRoaXMubWVtb3J5ICR7cGFyYW1ldGVyRGVyZWZlcmVuY2VzfSR7aW5wdXREZXJlZmVyZW5jZXN9JHttZW1iZXJTdHJpbmd9XG5cbiAgICAgIGZvciggbGV0IGkgPSAwOyBpIDwgbGVuOyArK2kgKSB7XG4gICAgICAgICR7cHJldHR5Q2FsbGJhY2t9XG4gICAgICAgICR7Z2VuaXNoT3V0cHV0TGluZX1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuICAgIFxucmVnaXN0ZXJQcm9jZXNzb3IoICcke25hbWV9JywgJHtuYW1lfVByb2Nlc3NvcilgXG5cbiAgICBcbiAgICAvKioqKiogZW5kIGNhbGxiYWNrIGNvZGUgKioqKiovXG5cblxuICAgIGlmKCBkZWJ1ZyA9PT0gdHJ1ZSApIGNvbnNvbGUubG9nKCB3b3JrbGV0Q29kZSApXG5cbiAgICBjb25zdCB1cmwgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChcbiAgICAgIG5ldyBCbG9iKFxuICAgICAgICBbIHdvcmtsZXRDb2RlIF0sIFxuICAgICAgICB7IHR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnIH1cbiAgICAgIClcbiAgICApXG5cbiAgICByZXR1cm4gWyB1cmwsIHdvcmtsZXRDb2RlLCBpbnB1dHMsIGNiLnBhcmFtcywgY2IuaXNTdGVyZW8gXSBcbiAgfSxcblxuICByZWdpc3RlcmVkRm9yTm9kZUFzc2lnbm1lbnQ6IFtdLFxuICByZWdpc3RlciggdWdlbiApIHtcbiAgICBpZiggdGhpcy5yZWdpc3RlcmVkRm9yTm9kZUFzc2lnbm1lbnQuaW5kZXhPZiggdWdlbiApID09PSAtMSApIHtcbiAgICAgIHRoaXMucmVnaXN0ZXJlZEZvck5vZGVBc3NpZ25tZW50LnB1c2goIHVnZW4gKVxuICAgIH1cbiAgfSxcblxuICBwbGF5V29ya2xldCggZ3JhcGgsIG5hbWUsIGRlYnVnPWZhbHNlLCBtZW09NDQxMDAgKiA2MCApIHtcbiAgICB1dGlsaXRpZXMuY2xlYXIoKVxuXG4gICAgY29uc3QgWyB1cmwsIGNvZGVTdHJpbmcsIGlucHV0cywgcGFyYW1zLCBpc1N0ZXJlbyBdID0gdXRpbGl0aWVzLmNyZWF0ZVdvcmtsZXRQcm9jZXNzb3IoIGdyYXBoLCBuYW1lLCBkZWJ1ZywgbWVtIClcblxuICAgIGNvbnN0IG5vZGVQcm9taXNlID0gbmV3IFByb21pc2UoIChyZXNvbHZlLHJlamVjdCkgPT4ge1xuICAgXG4gICAgICB1dGlsaXRpZXMuY3R4LmF1ZGlvV29ya2xldC5hZGRNb2R1bGUoIHVybCApLnRoZW4oICgpPT4ge1xuICAgICAgICBjb25zdCB3b3JrbGV0Tm9kZSA9IG5ldyBBdWRpb1dvcmtsZXROb2RlKCB1dGlsaXRpZXMuY3R4LCBuYW1lLCB7IG91dHB1dENoYW5uZWxDb3VudDpbIGlzU3RlcmVvID8gMiA6IDEgXSB9KVxuXG4gICAgICAgIHdvcmtsZXROb2RlLmNhbGxiYWNrcyA9IHt9XG4gICAgICAgIHdvcmtsZXROb2RlLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgICAgICAgICBpZiggZXZlbnQuZGF0YS5tZXNzYWdlID09PSAncmV0dXJuJyApIHtcbiAgICAgICAgICAgIHdvcmtsZXROb2RlLmNhbGxiYWNrc1sgZXZlbnQuZGF0YS5pZHggXSggZXZlbnQuZGF0YS52YWx1ZSApXG4gICAgICAgICAgICBkZWxldGUgd29ya2xldE5vZGUuY2FsbGJhY2tzWyBldmVudC5kYXRhLmlkeCBdXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgd29ya2xldE5vZGUuZ2V0TWVtb3J5VmFsdWUgPSBmdW5jdGlvbiggaWR4LCBjYiApIHtcbiAgICAgICAgICB0aGlzLndvcmtsZXRDYWxsYmFja3NbIGlkeCBdID0gY2JcbiAgICAgICAgICB0aGlzLndvcmtsZXROb2RlLnBvcnQucG9zdE1lc3NhZ2UoeyBrZXk6J2dldCcsIGlkeDogaWR4IH0pXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHdvcmtsZXROb2RlLnBvcnQucG9zdE1lc3NhZ2UoeyBrZXk6J2luaXQnLCBtZW1vcnk6Z2VuLm1lbW9yeS5oZWFwIH0pXG4gICAgICAgIHV0aWxpdGllcy53b3JrbGV0Tm9kZSA9IHdvcmtsZXROb2RlXG5cbiAgICAgICAgdXRpbGl0aWVzLnJlZ2lzdGVyZWRGb3JOb2RlQXNzaWdubWVudC5mb3JFYWNoKCB1Z2VuID0+IHVnZW4ubm9kZSA9IHdvcmtsZXROb2RlIClcbiAgICAgICAgdXRpbGl0aWVzLnJlZ2lzdGVyZWRGb3JOb2RlQXNzaWdubWVudC5sZW5ndGggPSAwXG5cbiAgICAgICAgLy8gYXNzaWduIGFsbCBwYXJhbXMgYXMgcHJvcGVydGllcyBvZiBub2RlIGZvciBlYXNpZXIgcmVmZXJlbmNlIFxuICAgICAgICBmb3IoIGxldCBkaWN0IG9mIGlucHV0cy52YWx1ZXMoKSApIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gT2JqZWN0LmtleXMoIGRpY3QgKVswXVxuICAgICAgICAgIGNvbnN0IHBhcmFtID0gd29ya2xldE5vZGUucGFyYW1ldGVycy5nZXQoIG5hbWUgKVxuICAgICAgXG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCB3b3JrbGV0Tm9kZSwgbmFtZSwge1xuICAgICAgICAgICAgc2V0KCB2ICkge1xuICAgICAgICAgICAgICBwYXJhbS52YWx1ZSA9IHZcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICAgIHJldHVybiBwYXJhbS52YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBmb3IoIGxldCB1Z2VuIG9mIHBhcmFtcy52YWx1ZXMoKSApIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gdWdlbi5uYW1lXG4gICAgICAgICAgY29uc3QgcGFyYW0gPSB3b3JrbGV0Tm9kZS5wYXJhbWV0ZXJzLmdldCggbmFtZSApXG4gICAgICAgICAgdWdlbi53YWFwaSA9IHBhcmFtIFxuICAgICAgICAgIC8vIGluaXRpYWxpemU/XG4gICAgICAgICAgcGFyYW0udmFsdWUgPSB1Z2VuLmRlZmF1bHRWYWx1ZVxuXG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCB3b3JrbGV0Tm9kZSwgbmFtZSwge1xuICAgICAgICAgICAgc2V0KCB2ICkge1xuICAgICAgICAgICAgICBwYXJhbS52YWx1ZSA9IHZcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICAgIHJldHVybiBwYXJhbS52YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBpZiggdXRpbGl0aWVzLmNvbnNvbGUgKSB1dGlsaXRpZXMuY29uc29sZS5zZXRWYWx1ZSggY29kZVN0cmluZyApXG5cbiAgICAgICAgd29ya2xldE5vZGUuY29ubmVjdCggdXRpbGl0aWVzLmN0eC5kZXN0aW5hdGlvbiApXG5cbiAgICAgICAgcmVzb2x2ZSggd29ya2xldE5vZGUgKVxuICAgICAgfSlcblxuICAgIH0pXG5cbiAgICByZXR1cm4gbm9kZVByb21pc2VcbiAgfSxcbiAgXG4gIHBsYXlHcmFwaCggZ3JhcGgsIGRlYnVnLCBtZW09NDQxMDAqMTAsIG1lbVR5cGU9RmxvYXQzMkFycmF5ICkge1xuICAgIHV0aWxpdGllcy5jbGVhcigpXG4gICAgaWYoIGRlYnVnID09PSB1bmRlZmluZWQgKSBkZWJ1ZyA9IGZhbHNlXG4gICAgICAgICAgXG4gICAgdGhpcy5pc1N0ZXJlbyA9IEFycmF5LmlzQXJyYXkoIGdyYXBoIClcblxuICAgIHV0aWxpdGllcy5jYWxsYmFjayA9IGdlbi5jcmVhdGVDYWxsYmFjayggZ3JhcGgsIG1lbSwgZGVidWcsIGZhbHNlLCBtZW1UeXBlIClcbiAgICBcbiAgICBpZiggdXRpbGl0aWVzLmNvbnNvbGUgKSB1dGlsaXRpZXMuY29uc29sZS5zZXRWYWx1ZSggdXRpbGl0aWVzLmNhbGxiYWNrLnRvU3RyaW5nKCkgKVxuXG4gICAgcmV0dXJuIHV0aWxpdGllcy5jYWxsYmFja1xuICB9LFxuXG4gIGxvYWRTYW1wbGUoIHNvdW5kRmlsZVBhdGgsIGRhdGEgKSB7XG4gICAgY29uc3QgaXNMb2FkZWQgPSB1dGlsaXRpZXMuYnVmZmVyc1sgc291bmRGaWxlUGF0aCBdICE9PSB1bmRlZmluZWRcblxuICAgIGxldCByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuICAgIHJlcS5vcGVuKCAnR0VUJywgc291bmRGaWxlUGF0aCwgdHJ1ZSApXG4gICAgcmVxLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcicgXG4gICAgXG4gICAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZSggKHJlc29sdmUscmVqZWN0KSA9PiB7XG4gICAgICBpZiggIWlzTG9hZGVkICkge1xuICAgICAgICByZXEub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGF1ZGlvRGF0YSA9IHJlcS5yZXNwb25zZVxuXG4gICAgICAgICAgdXRpbGl0aWVzLmN0eC5kZWNvZGVBdWRpb0RhdGEoIGF1ZGlvRGF0YSwgKGJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgZGF0YS5idWZmZXIgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoMClcbiAgICAgICAgICAgIHV0aWxpdGllcy5idWZmZXJzWyBzb3VuZEZpbGVQYXRoIF0gPSBkYXRhLmJ1ZmZlclxuICAgICAgICAgICAgcmVzb2x2ZSggZGF0YS5idWZmZXIgKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1lbHNle1xuICAgICAgICBzZXRUaW1lb3V0KCAoKT0+IHJlc29sdmUoIHV0aWxpdGllcy5idWZmZXJzWyBzb3VuZEZpbGVQYXRoIF0gKSwgMCApXG4gICAgICB9XG4gICAgfSlcblxuICAgIGlmKCAhaXNMb2FkZWQgKSByZXEuc2VuZCgpXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbn1cblxudXRpbGl0aWVzLmNsZWFyLmNhbGxiYWNrcyA9IFtdXG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbGl0aWVzXG4iLCIndXNlIHN0cmljdCdcblxuLypcbiAqIG1hbnkgd2luZG93cyBoZXJlIGFkYXB0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vY29yYmFuYnJvb2svZHNwLmpzL2Jsb2IvbWFzdGVyL2RzcC5qc1xuICogc3RhcnRpbmcgYXQgbGluZSAxNDI3XG4gKiB0YWtlbiA4LzE1LzE2XG4qLyBcblxuY29uc3Qgd2luZG93cyA9IG1vZHVsZS5leHBvcnRzID0geyBcbiAgYmFydGxldHQoIGxlbmd0aCwgaW5kZXggKSB7XG4gICAgcmV0dXJuIDIgLyAobGVuZ3RoIC0gMSkgKiAoKGxlbmd0aCAtIDEpIC8gMiAtIE1hdGguYWJzKGluZGV4IC0gKGxlbmd0aCAtIDEpIC8gMikpIFxuICB9LFxuXG4gIGJhcnRsZXR0SGFubiggbGVuZ3RoLCBpbmRleCApIHtcbiAgICByZXR1cm4gMC42MiAtIDAuNDggKiBNYXRoLmFicyhpbmRleCAvIChsZW5ndGggLSAxKSAtIDAuNSkgLSAwLjM4ICogTWF0aC5jb3MoIDIgKiBNYXRoLlBJICogaW5kZXggLyAobGVuZ3RoIC0gMSkpXG4gIH0sXG5cbiAgYmxhY2ttYW4oIGxlbmd0aCwgaW5kZXgsIGFscGhhICkge1xuICAgIGxldCBhMCA9ICgxIC0gYWxwaGEpIC8gMixcbiAgICAgICAgYTEgPSAwLjUsXG4gICAgICAgIGEyID0gYWxwaGEgLyAyXG5cbiAgICByZXR1cm4gYTAgLSBhMSAqIE1hdGguY29zKDIgKiBNYXRoLlBJICogaW5kZXggLyAobGVuZ3RoIC0gMSkpICsgYTIgKiBNYXRoLmNvcyg0ICogTWF0aC5QSSAqIGluZGV4IC8gKGxlbmd0aCAtIDEpKVxuICB9LFxuXG4gIGNvc2luZSggbGVuZ3RoLCBpbmRleCApIHtcbiAgICByZXR1cm4gTWF0aC5jb3MoTWF0aC5QSSAqIGluZGV4IC8gKGxlbmd0aCAtIDEpIC0gTWF0aC5QSSAvIDIpXG4gIH0sXG5cbiAgZ2F1c3MoIGxlbmd0aCwgaW5kZXgsIGFscGhhICkge1xuICAgIHJldHVybiBNYXRoLnBvdyhNYXRoLkUsIC0wLjUgKiBNYXRoLnBvdygoaW5kZXggLSAobGVuZ3RoIC0gMSkgLyAyKSAvIChhbHBoYSAqIChsZW5ndGggLSAxKSAvIDIpLCAyKSlcbiAgfSxcblxuICBoYW1taW5nKCBsZW5ndGgsIGluZGV4ICkge1xuICAgIHJldHVybiAwLjU0IC0gMC40NiAqIE1hdGguY29zKCBNYXRoLlBJICogMiAqIGluZGV4IC8gKGxlbmd0aCAtIDEpKVxuICB9LFxuXG4gIGhhbm4oIGxlbmd0aCwgaW5kZXggKSB7XG4gICAgcmV0dXJuIDAuNSAqICgxIC0gTWF0aC5jb3MoIE1hdGguUEkgKiAyICogaW5kZXggLyAobGVuZ3RoIC0gMSkpIClcbiAgfSxcblxuICBsYW5jem9zKCBsZW5ndGgsIGluZGV4ICkge1xuICAgIGxldCB4ID0gMiAqIGluZGV4IC8gKGxlbmd0aCAtIDEpIC0gMTtcbiAgICByZXR1cm4gTWF0aC5zaW4oTWF0aC5QSSAqIHgpIC8gKE1hdGguUEkgKiB4KVxuICB9LFxuXG4gIHJlY3Rhbmd1bGFyKCBsZW5ndGgsIGluZGV4ICkge1xuICAgIHJldHVybiAxXG4gIH0sXG5cbiAgdHJpYW5ndWxhciggbGVuZ3RoLCBpbmRleCApIHtcbiAgICByZXR1cm4gMiAvIGxlbmd0aCAqIChsZW5ndGggLyAyIC0gTWF0aC5hYnMoaW5kZXggLSAobGVuZ3RoIC0gMSkgLyAyKSlcbiAgfSxcblxuICAvLyBwYXJhYm9sYVxuICB3ZWxjaCggbGVuZ3RoLCBfaW5kZXgsIGlnbm9yZSwgc2hpZnQ9MCApIHtcbiAgICAvL3dbbl0gPSAxIC0gTWF0aC5wb3coICggbiAtICggKE4tMSkgLyAyICkgKSAvICgoIE4tMSApIC8gMiApLCAyIClcbiAgICBjb25zdCBpbmRleCA9IHNoaWZ0ID09PSAwID8gX2luZGV4IDogKF9pbmRleCArIE1hdGguZmxvb3IoIHNoaWZ0ICogbGVuZ3RoICkpICUgbGVuZ3RoXG4gICAgY29uc3Qgbl8xX292ZXIyID0gKGxlbmd0aCAtIDEpIC8gMiBcblxuICAgIHJldHVybiAxIC0gTWF0aC5wb3coICggaW5kZXggLSBuXzFfb3ZlcjIgKSAvIG5fMV9vdmVyMiwgMiApXG4gIH0sXG4gIGludmVyc2V3ZWxjaCggbGVuZ3RoLCBfaW5kZXgsIGlnbm9yZSwgc2hpZnQ9MCApIHtcbiAgICAvL3dbbl0gPSAxIC0gTWF0aC5wb3coICggbiAtICggKE4tMSkgLyAyICkgKSAvICgoIE4tMSApIC8gMiApLCAyIClcbiAgICBsZXQgaW5kZXggPSBzaGlmdCA9PT0gMCA/IF9pbmRleCA6IChfaW5kZXggKyBNYXRoLmZsb29yKCBzaGlmdCAqIGxlbmd0aCApKSAlIGxlbmd0aFxuICAgIGNvbnN0IG5fMV9vdmVyMiA9IChsZW5ndGggLSAxKSAvIDJcblxuICAgIHJldHVybiBNYXRoLnBvdyggKCBpbmRleCAtIG5fMV9vdmVyMiApIC8gbl8xX292ZXIyLCAyIClcbiAgfSxcblxuICBwYXJhYm9sYSggbGVuZ3RoLCBpbmRleCApIHtcbiAgICBpZiggaW5kZXggPD0gbGVuZ3RoIC8gMiApIHtcbiAgICAgIHJldHVybiB3aW5kb3dzLmludmVyc2V3ZWxjaCggbGVuZ3RoIC8gMiwgaW5kZXggKSAtIDFcbiAgICB9ZWxzZXtcbiAgICAgIHJldHVybiAxIC0gd2luZG93cy5pbnZlcnNld2VsY2goIGxlbmd0aCAvIDIsIGluZGV4IC0gbGVuZ3RoIC8gMiApXG4gICAgfVxuICB9LFxuXG4gIGV4cG9uZW50aWFsKCBsZW5ndGgsIGluZGV4LCBhbHBoYSApIHtcbiAgICByZXR1cm4gTWF0aC5wb3coIGluZGV4IC8gbGVuZ3RoLCBhbHBoYSApXG4gIH0sXG5cbiAgbGluZWFyKCBsZW5ndGgsIGluZGV4ICkge1xuICAgIHJldHVybiBpbmRleCAvIGxlbmd0aFxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpLFxuICAgIGZsb29yPSByZXF1aXJlKCcuL2Zsb29yLmpzJyksXG4gICAgc3ViICA9IHJlcXVpcmUoJy4vc3ViLmpzJyksXG4gICAgbWVtbyA9IHJlcXVpcmUoJy4vbWVtby5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J3dyYXAnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgY29kZSxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApLFxuICAgICAgICBzaWduYWwgPSBpbnB1dHNbMF0sIG1pbiA9IGlucHV0c1sxXSwgbWF4ID0gaW5wdXRzWzJdLFxuICAgICAgICBvdXQsIGRpZmZcblxuICAgIC8vb3V0ID0gYCgoKCR7aW5wdXRzWzBdfSAtICR7dGhpcy5taW59KSAlICR7ZGlmZn0gICsgJHtkaWZmfSkgJSAke2RpZmZ9ICsgJHt0aGlzLm1pbn0pYFxuICAgIC8vY29uc3QgbG9uZyBudW1XcmFwcyA9IGxvbmcoKHYtbG8pL3JhbmdlKSAtICh2IDwgbG8pO1xuICAgIC8vcmV0dXJuIHYgLSByYW5nZSAqIGRvdWJsZShudW1XcmFwcyk7ICAgXG4gICAgXG4gICAgaWYoIHRoaXMubWluID09PSAwICkge1xuICAgICAgZGlmZiA9IG1heFxuICAgIH1lbHNlIGlmICggaXNOYU4oIG1heCApIHx8IGlzTmFOKCBtaW4gKSApIHtcbiAgICAgIGRpZmYgPSBgJHttYXh9IC0gJHttaW59YFxuICAgIH1lbHNle1xuICAgICAgZGlmZiA9IG1heCAtIG1pblxuICAgIH1cblxuICAgIG91dCA9XG5gIHZhciAke3RoaXMubmFtZX0gPSAke2lucHV0c1swXX1cbiAgaWYoICR7dGhpcy5uYW1lfSA8ICR7dGhpcy5taW59ICkgJHt0aGlzLm5hbWV9ICs9ICR7ZGlmZn1cbiAgZWxzZSBpZiggJHt0aGlzLm5hbWV9ID4gJHt0aGlzLm1heH0gKSAke3RoaXMubmFtZX0gLT0gJHtkaWZmfVxuXG5gXG5cbiAgICByZXR1cm4gWyB0aGlzLm5hbWUsICcgJyArIG91dCBdXG4gIH0sXG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCBpbjEsIG1pbj0wLCBtYXg9MSApID0+IHtcbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwgeyBcbiAgICBtaW4sIFxuICAgIG1heCxcbiAgICB1aWQ6ICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6IFsgaW4xLCBtaW4sIG1heCBdLFxuICB9KVxuICBcbiAgdWdlbi5uYW1lID0gYCR7dWdlbi5iYXNlbmFtZX0ke3VnZW4udWlkfWBcblxuICByZXR1cm4gdWdlblxufVxuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBvYmplY3RDcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IG9iamVjdENyZWF0ZVBvbHlmaWxsXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IG9iamVjdEtleXNQb2x5ZmlsbFxudmFyIGJpbmQgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCB8fCBmdW5jdGlvbkJpbmRQb2x5ZmlsbFxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcywgJ19ldmVudHMnKSkge1xuICAgIHRoaXMuX2V2ZW50cyA9IG9iamVjdENyZWF0ZShudWxsKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG52YXIgaGFzRGVmaW5lUHJvcGVydHk7XG50cnkge1xuICB2YXIgbyA9IHt9O1xuICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KSBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgJ3gnLCB7IHZhbHVlOiAwIH0pO1xuICBoYXNEZWZpbmVQcm9wZXJ0eSA9IG8ueCA9PT0gMDtcbn0gY2F0Y2ggKGVycikgeyBoYXNEZWZpbmVQcm9wZXJ0eSA9IGZhbHNlIH1cbmlmIChoYXNEZWZpbmVQcm9wZXJ0eSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLCAnZGVmYXVsdE1heExpc3RlbmVycycsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAvLyBjaGVjayB3aGV0aGVyIHRoZSBpbnB1dCBpcyBhIHBvc2l0aXZlIG51bWJlciAod2hvc2UgdmFsdWUgaXMgemVybyBvclxuICAgICAgLy8gZ3JlYXRlciBhbmQgbm90IGEgTmFOKS5cbiAgICAgIGlmICh0eXBlb2YgYXJnICE9PSAnbnVtYmVyJyB8fCBhcmcgPCAwIHx8IGFyZyAhPT0gYXJnKVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImRlZmF1bHRNYXhMaXN0ZW5lcnNcIiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gICAgICBkZWZhdWx0TWF4TGlzdGVuZXJzID0gYXJnO1xuICAgIH1cbiAgfSk7XG59IGVsc2Uge1xuICBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG59XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycyhuKSB7XG4gIGlmICh0eXBlb2YgbiAhPT0gJ251bWJlcicgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJuXCIgYXJndW1lbnQgbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbmZ1bmN0aW9uICRnZXRNYXhMaXN0ZW5lcnModGhhdCkge1xuICBpZiAodGhhdC5fbWF4TGlzdGVuZXJzID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICByZXR1cm4gdGhhdC5fbWF4TGlzdGVuZXJzO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmdldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuICRnZXRNYXhMaXN0ZW5lcnModGhpcyk7XG59O1xuXG4vLyBUaGVzZSBzdGFuZGFsb25lIGVtaXQqIGZ1bmN0aW9ucyBhcmUgdXNlZCB0byBvcHRpbWl6ZSBjYWxsaW5nIG9mIGV2ZW50XG4vLyBoYW5kbGVycyBmb3IgZmFzdCBjYXNlcyBiZWNhdXNlIGVtaXQoKSBpdHNlbGYgb2Z0ZW4gaGFzIGEgdmFyaWFibGUgbnVtYmVyIG9mXG4vLyBhcmd1bWVudHMgYW5kIGNhbiBiZSBkZW9wdGltaXplZCBiZWNhdXNlIG9mIHRoYXQuIFRoZXNlIGZ1bmN0aW9ucyBhbHdheXMgaGF2ZVxuLy8gdGhlIHNhbWUgbnVtYmVyIG9mIGFyZ3VtZW50cyBhbmQgdGh1cyBkbyBub3QgZ2V0IGRlb3B0aW1pemVkLCBzbyB0aGUgY29kZVxuLy8gaW5zaWRlIHRoZW0gY2FuIGV4ZWN1dGUgZmFzdGVyLlxuZnVuY3Rpb24gZW1pdE5vbmUoaGFuZGxlciwgaXNGbiwgc2VsZikge1xuICBpZiAoaXNGbilcbiAgICBoYW5kbGVyLmNhbGwoc2VsZik7XG4gIGVsc2Uge1xuICAgIHZhciBsZW4gPSBoYW5kbGVyLmxlbmd0aDtcbiAgICB2YXIgbGlzdGVuZXJzID0gYXJyYXlDbG9uZShoYW5kbGVyLCBsZW4pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpXG4gICAgICBsaXN0ZW5lcnNbaV0uY2FsbChzZWxmKTtcbiAgfVxufVxuZnVuY3Rpb24gZW1pdE9uZShoYW5kbGVyLCBpc0ZuLCBzZWxmLCBhcmcxKSB7XG4gIGlmIChpc0ZuKVxuICAgIGhhbmRsZXIuY2FsbChzZWxmLCBhcmcxKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHNlbGYsIGFyZzEpO1xuICB9XG59XG5mdW5jdGlvbiBlbWl0VHdvKGhhbmRsZXIsIGlzRm4sIHNlbGYsIGFyZzEsIGFyZzIpIHtcbiAgaWYgKGlzRm4pXG4gICAgaGFuZGxlci5jYWxsKHNlbGYsIGFyZzEsIGFyZzIpO1xuICBlbHNlIHtcbiAgICB2YXIgbGVuID0gaGFuZGxlci5sZW5ndGg7XG4gICAgdmFyIGxpc3RlbmVycyA9IGFycmF5Q2xvbmUoaGFuZGxlciwgbGVuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKVxuICAgICAgbGlzdGVuZXJzW2ldLmNhbGwoc2VsZiwgYXJnMSwgYXJnMik7XG4gIH1cbn1cbmZ1bmN0aW9uIGVtaXRUaHJlZShoYW5kbGVyLCBpc0ZuLCBzZWxmLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gIGlmIChpc0ZuKVxuICAgIGhhbmRsZXIuY2FsbChzZWxmLCBhcmcxLCBhcmcyLCBhcmczKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHNlbGYsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGVtaXRNYW55KGhhbmRsZXIsIGlzRm4sIHNlbGYsIGFyZ3MpIHtcbiAgaWYgKGlzRm4pXG4gICAgaGFuZGxlci5hcHBseShzZWxmLCBhcmdzKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGV2ZW50cztcbiAgdmFyIGRvRXJyb3IgPSAodHlwZSA9PT0gJ2Vycm9yJyk7XG5cbiAgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuICBpZiAoZXZlbnRzKVxuICAgIGRvRXJyb3IgPSAoZG9FcnJvciAmJiBldmVudHMuZXJyb3IgPT0gbnVsbCk7XG4gIGVsc2UgaWYgKCFkb0Vycm9yKVxuICAgIHJldHVybiBmYWxzZTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmIChkb0Vycm9yKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKVxuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmhhbmRsZWQgXCJlcnJvclwiIGV2ZW50LiAoJyArIGVyICsgJyknKTtcbiAgICAgIGVyci5jb250ZXh0ID0gZXI7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGhhbmRsZXIgPSBldmVudHNbdHlwZV07XG5cbiAgaWYgKCFoYW5kbGVyKVxuICAgIHJldHVybiBmYWxzZTtcblxuICB2YXIgaXNGbiA9IHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nO1xuICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICBzd2l0Y2ggKGxlbikge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgIGNhc2UgMTpcbiAgICAgIGVtaXROb25lKGhhbmRsZXIsIGlzRm4sIHRoaXMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgICAgZW1pdE9uZShoYW5kbGVyLCBpc0ZuLCB0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzOlxuICAgICAgZW1pdFR3byhoYW5kbGVyLCBpc0ZuLCB0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICBlbWl0VGhyZWUoaGFuZGxlciwgaXNGbiwgdGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0sIGFyZ3VtZW50c1szXSk7XG4gICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgIGRlZmF1bHQ6XG4gICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGVtaXRNYW55KGhhbmRsZXIsIGlzRm4sIHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5mdW5jdGlvbiBfYWRkTGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgcHJlcGVuZCkge1xuICB2YXIgbTtcbiAgdmFyIGV2ZW50cztcbiAgdmFyIGV4aXN0aW5nO1xuXG4gIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuICBpZiAoIWV2ZW50cykge1xuICAgIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgIHRhcmdldC5fZXZlbnRzQ291bnQgPSAwO1xuICB9IGVsc2Uge1xuICAgIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gICAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICAgIGlmIChldmVudHMubmV3TGlzdGVuZXIpIHtcbiAgICAgIHRhcmdldC5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgPyBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICAgICAgLy8gUmUtYXNzaWduIGBldmVudHNgIGJlY2F1c2UgYSBuZXdMaXN0ZW5lciBoYW5kbGVyIGNvdWxkIGhhdmUgY2F1c2VkIHRoZVxuICAgICAgLy8gdGhpcy5fZXZlbnRzIHRvIGJlIGFzc2lnbmVkIHRvIGEgbmV3IG9iamVjdFxuICAgICAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHM7XG4gICAgfVxuICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdO1xuICB9XG5cbiAgaWYgKCFleGlzdGluZykge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gICAgKyt0YXJnZXQuX2V2ZW50c0NvdW50O1xuICB9IGVsc2Uge1xuICAgIGlmICh0eXBlb2YgZXhpc3RpbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV0gPVxuICAgICAgICAgIHByZXBlbmQgPyBbbGlzdGVuZXIsIGV4aXN0aW5nXSA6IFtleGlzdGluZywgbGlzdGVuZXJdO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgICBpZiAocHJlcGVuZCkge1xuICAgICAgICBleGlzdGluZy51bnNoaWZ0KGxpc3RlbmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV4aXN0aW5nLnB1c2gobGlzdGVuZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgaWYgKCFleGlzdGluZy53YXJuZWQpIHtcbiAgICAgIG0gPSAkZ2V0TWF4TGlzdGVuZXJzKHRhcmdldCk7XG4gICAgICBpZiAobSAmJiBtID4gMCAmJiBleGlzdGluZy5sZW5ndGggPiBtKSB7XG4gICAgICAgIGV4aXN0aW5nLndhcm5lZCA9IHRydWU7XG4gICAgICAgIHZhciB3ID0gbmV3IEVycm9yKCdQb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5IGxlYWsgZGV0ZWN0ZWQuICcgK1xuICAgICAgICAgICAgZXhpc3RpbmcubGVuZ3RoICsgJyBcIicgKyBTdHJpbmcodHlwZSkgKyAnXCIgbGlzdGVuZXJzICcgK1xuICAgICAgICAgICAgJ2FkZGVkLiBVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byAnICtcbiAgICAgICAgICAgICdpbmNyZWFzZSBsaW1pdC4nKTtcbiAgICAgICAgdy5uYW1lID0gJ01heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZyc7XG4gICAgICAgIHcuZW1pdHRlciA9IHRhcmdldDtcbiAgICAgICAgdy50eXBlID0gdHlwZTtcbiAgICAgICAgdy5jb3VudCA9IGV4aXN0aW5nLmxlbmd0aDtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlID09PSAnb2JqZWN0JyAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJyVzOiAlcycsIHcubmFtZSwgdy5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICByZXR1cm4gX2FkZExpc3RlbmVyKHRoaXMsIHR5cGUsIGxpc3RlbmVyLCBmYWxzZSk7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHByZXBlbmRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgcmV0dXJuIF9hZGRMaXN0ZW5lcih0aGlzLCB0eXBlLCBsaXN0ZW5lciwgdHJ1ZSk7XG4gICAgfTtcblxuZnVuY3Rpb24gb25jZVdyYXBwZXIoKSB7XG4gIGlmICghdGhpcy5maXJlZCkge1xuICAgIHRoaXMudGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHRoaXMudHlwZSwgdGhpcy53cmFwRm4pO1xuICAgIHRoaXMuZmlyZWQgPSB0cnVlO1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgY2FzZSAwOlxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0KTtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXIuY2FsbCh0aGlzLnRhcmdldCwgYXJndW1lbnRzWzBdKTtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXIuY2FsbCh0aGlzLnRhcmdldCwgYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pO1xuICAgICAgY2FzZSAzOlxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0LCBhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSxcbiAgICAgICAgICAgIGFyZ3VtZW50c1syXSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKVxuICAgICAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIHRoaXMubGlzdGVuZXIuYXBwbHkodGhpcy50YXJnZXQsIGFyZ3MpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBfb25jZVdyYXAodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgc3RhdGUgPSB7IGZpcmVkOiBmYWxzZSwgd3JhcEZuOiB1bmRlZmluZWQsIHRhcmdldDogdGFyZ2V0LCB0eXBlOiB0eXBlLCBsaXN0ZW5lcjogbGlzdGVuZXIgfTtcbiAgdmFyIHdyYXBwZWQgPSBiaW5kLmNhbGwob25jZVdyYXBwZXIsIHN0YXRlKTtcbiAgd3JhcHBlZC5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICBzdGF0ZS53cmFwRm4gPSB3cmFwcGVkO1xuICByZXR1cm4gd3JhcHBlZDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZSh0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdGVuZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgdGhpcy5vbih0eXBlLCBfb25jZVdyYXAodGhpcywgdHlwZSwgbGlzdGVuZXIpKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRPbmNlTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHByZXBlbmRPbmNlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdGVuZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgIHRoaXMucHJlcGVuZExpc3RlbmVyKHR5cGUsIF9vbmNlV3JhcCh0aGlzLCB0eXBlLCBsaXN0ZW5lcikpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuLy8gRW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmIGFuZCBvbmx5IGlmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICB2YXIgbGlzdCwgZXZlbnRzLCBwb3NpdGlvbiwgaSwgb3JpZ2luYWxMaXN0ZW5lcjtcblxuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoIWV2ZW50cylcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIGxpc3QgPSBldmVudHNbdHlwZV07XG4gICAgICBpZiAoIWxpc3QpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHwgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApXG4gICAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdC5saXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcG9zaXRpb24gPSAtMTtcblxuICAgICAgICBmb3IgKGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8IGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBvcmlnaW5hbExpc3RlbmVyID0gbGlzdFtpXS5saXN0ZW5lcjtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSAwKVxuICAgICAgICAgIGxpc3Quc2hpZnQoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNwbGljZU9uZShsaXN0LCBwb3NpdGlvbik7XG5cbiAgICAgICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKVxuICAgICAgICAgIGV2ZW50c1t0eXBlXSA9IGxpc3RbMF07XG5cbiAgICAgICAgaWYgKGV2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgb3JpZ2luYWxMaXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID1cbiAgICBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnModHlwZSkge1xuICAgICAgdmFyIGxpc3RlbmVycywgZXZlbnRzLCBpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoIWV2ZW50cylcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgICAgIGlmICghZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudHNbdHlwZV0pIHtcbiAgICAgICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMClcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IG9iamVjdENyZWF0ZShudWxsKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHZhciBrZXlzID0gb2JqZWN0S2V5cyhldmVudHMpO1xuICAgICAgICB2YXIga2V5O1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICBsaXN0ZW5lcnMgPSBldmVudHNbdHlwZV07XG5cbiAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgICAgIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgICAgIC8vIExJRk8gb3JkZXJcbiAgICAgICAgZm9yIChpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbmZ1bmN0aW9uIF9saXN0ZW5lcnModGFyZ2V0LCB0eXBlLCB1bndyYXApIHtcbiAgdmFyIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuXG4gIGlmICghZXZlbnRzKVxuICAgIHJldHVybiBbXTtcblxuICB2YXIgZXZsaXN0ZW5lciA9IGV2ZW50c1t0eXBlXTtcbiAgaWYgKCFldmxpc3RlbmVyKVxuICAgIHJldHVybiBbXTtcblxuICBpZiAodHlwZW9mIGV2bGlzdGVuZXIgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIHVud3JhcCA/IFtldmxpc3RlbmVyLmxpc3RlbmVyIHx8IGV2bGlzdGVuZXJdIDogW2V2bGlzdGVuZXJdO1xuXG4gIHJldHVybiB1bndyYXAgPyB1bndyYXBMaXN0ZW5lcnMoZXZsaXN0ZW5lcikgOiBhcnJheUNsb25lKGV2bGlzdGVuZXIsIGV2bGlzdGVuZXIubGVuZ3RoKTtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnModHlwZSkge1xuICByZXR1cm4gX2xpc3RlbmVycyh0aGlzLCB0eXBlLCB0cnVlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmF3TGlzdGVuZXJzID0gZnVuY3Rpb24gcmF3TGlzdGVuZXJzKHR5cGUpIHtcbiAgcmV0dXJuIF9saXN0ZW5lcnModGhpcywgdHlwZSwgZmFsc2UpO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIGlmICh0eXBlb2YgZW1pdHRlci5saXN0ZW5lckNvdW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbGlzdGVuZXJDb3VudC5jYWxsKGVtaXR0ZXIsIHR5cGUpO1xuICB9XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBsaXN0ZW5lckNvdW50O1xuZnVuY3Rpb24gbGlzdGVuZXJDb3VudCh0eXBlKSB7XG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHM7XG5cbiAgaWYgKGV2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKHR5cGVvZiBldmxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9IGVsc2UgaWYgKGV2bGlzdGVuZXIpIHtcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gMDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgcmV0dXJuIHRoaXMuX2V2ZW50c0NvdW50ID4gMCA/IFJlZmxlY3Qub3duS2V5cyh0aGlzLl9ldmVudHMpIDogW107XG59O1xuXG4vLyBBYm91dCAxLjV4IGZhc3RlciB0aGFuIHRoZSB0d28tYXJnIHZlcnNpb24gb2YgQXJyYXkjc3BsaWNlKCkuXG5mdW5jdGlvbiBzcGxpY2VPbmUobGlzdCwgaW5kZXgpIHtcbiAgZm9yICh2YXIgaSA9IGluZGV4LCBrID0gaSArIDEsIG4gPSBsaXN0Lmxlbmd0aDsgayA8IG47IGkgKz0gMSwgayArPSAxKVxuICAgIGxpc3RbaV0gPSBsaXN0W2tdO1xuICBsaXN0LnBvcCgpO1xufVxuXG5mdW5jdGlvbiBhcnJheUNsb25lKGFyciwgbikge1xuICB2YXIgY29weSA9IG5ldyBBcnJheShuKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpXG4gICAgY29weVtpXSA9IGFycltpXTtcbiAgcmV0dXJuIGNvcHk7XG59XG5cbmZ1bmN0aW9uIHVud3JhcExpc3RlbmVycyhhcnIpIHtcbiAgdmFyIHJldCA9IG5ldyBBcnJheShhcnIubGVuZ3RoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXQubGVuZ3RoOyArK2kpIHtcbiAgICByZXRbaV0gPSBhcnJbaV0ubGlzdGVuZXIgfHwgYXJyW2ldO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIG9iamVjdENyZWF0ZVBvbHlmaWxsKHByb3RvKSB7XG4gIHZhciBGID0gZnVuY3Rpb24oKSB7fTtcbiAgRi5wcm90b3R5cGUgPSBwcm90bztcbiAgcmV0dXJuIG5ldyBGO1xufVxuZnVuY3Rpb24gb2JqZWN0S2V5c1BvbHlmaWxsKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrIGluIG9iaikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGspKSB7XG4gICAga2V5cy5wdXNoKGspO1xuICB9XG4gIHJldHVybiBrO1xufVxuZnVuY3Rpb24gZnVuY3Rpb25CaW5kUG9seWZpbGwoY29udGV4dCkge1xuICB2YXIgZm4gPSB0aGlzO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICB9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgTWVtb3J5SGVscGVyID0ge1xuICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZSgpIHtcbiAgICB2YXIgc2l6ZSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IDQwOTYgOiBhcmd1bWVudHNbMF07XG4gICAgdmFyIG1lbXR5cGUgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyBGbG9hdDMyQXJyYXkgOiBhcmd1bWVudHNbMV07XG5cbiAgICB2YXIgaGVscGVyID0gT2JqZWN0LmNyZWF0ZSh0aGlzKTtcblxuICAgIE9iamVjdC5hc3NpZ24oaGVscGVyLCB7XG4gICAgICBoZWFwOiBuZXcgbWVtdHlwZShzaXplKSxcbiAgICAgIGxpc3Q6IHt9LFxuICAgICAgZnJlZUxpc3Q6IHt9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gaGVscGVyO1xuICB9LFxuICBhbGxvYzogZnVuY3Rpb24gYWxsb2MoYW1vdW50KSB7XG4gICAgdmFyIGlkeCA9IC0xO1xuXG4gICAgaWYgKGFtb3VudCA+IHRoaXMuaGVhcC5sZW5ndGgpIHtcbiAgICAgIHRocm93IEVycm9yKCdBbGxvY2F0aW9uIHJlcXVlc3QgaXMgbGFyZ2VyIHRoYW4gaGVhcCBzaXplIG9mICcgKyB0aGlzLmhlYXAubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5mcmVlTGlzdCkge1xuICAgICAgdmFyIGNhbmRpZGF0ZVNpemUgPSB0aGlzLmZyZWVMaXN0W2tleV07XG5cbiAgICAgIGlmIChjYW5kaWRhdGVTaXplID49IGFtb3VudCkge1xuICAgICAgICBpZHggPSBrZXk7XG5cbiAgICAgICAgdGhpcy5saXN0W2lkeF0gPSBhbW91bnQ7XG5cbiAgICAgICAgaWYgKGNhbmRpZGF0ZVNpemUgIT09IGFtb3VudCkge1xuICAgICAgICAgIHZhciBuZXdJbmRleCA9IGlkeCArIGFtb3VudCxcbiAgICAgICAgICAgICAgbmV3RnJlZVNpemUgPSB2b2lkIDA7XG5cbiAgICAgICAgICBmb3IgKHZhciBfa2V5IGluIHRoaXMubGlzdCkge1xuICAgICAgICAgICAgaWYgKF9rZXkgPiBuZXdJbmRleCkge1xuICAgICAgICAgICAgICBuZXdGcmVlU2l6ZSA9IF9rZXkgLSBuZXdJbmRleDtcbiAgICAgICAgICAgICAgdGhpcy5mcmVlTGlzdFtuZXdJbmRleF0gPSBuZXdGcmVlU2l6ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpZiggaWR4ICE9PSAtMSApIGRlbGV0ZSB0aGlzLmZyZWVMaXN0WyBpZHggXVxuXG4gICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGhpcy5saXN0KSxcbiAgICAgICAgICBsYXN0SW5kZXggPSB2b2lkIDA7XG5cbiAgICAgIGlmIChrZXlzLmxlbmd0aCkge1xuICAgICAgICAvLyBpZiBub3QgZmlyc3QgYWxsb2NhdGlvbi4uLlxuICAgICAgICBsYXN0SW5kZXggPSBwYXJzZUludChrZXlzW2tleXMubGVuZ3RoIC0gMV0pO1xuXG4gICAgICAgIGlkeCA9IGxhc3RJbmRleCArIHRoaXMubGlzdFtsYXN0SW5kZXhdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWR4ID0gMDtcbiAgICAgIH1cblxuICAgICAgdGhpcy5saXN0W2lkeF0gPSBhbW91bnQ7XG4gICAgfVxuXG4gICAgaWYgKGlkeCArIGFtb3VudCA+PSB0aGlzLmhlYXAubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBFcnJvcignTm8gYXZhaWxhYmxlIGJsb2NrcyByZW1haW4gc3VmZmljaWVudCBmb3IgYWxsb2NhdGlvbiByZXF1ZXN0LicpO1xuICAgIH1cbiAgICByZXR1cm4gaWR4O1xuICB9LFxuICBmcmVlOiBmdW5jdGlvbiBmcmVlKGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmxpc3RbaW5kZXhdICE9PSAnbnVtYmVyJykge1xuICAgICAgdGhyb3cgRXJyb3IoJ0NhbGxpbmcgZnJlZSgpIG9uIG5vbi1leGlzdGluZyBibG9jay4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RbaW5kZXhdID0gMDtcblxuICAgIHZhciBzaXplID0gMDtcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5saXN0KSB7XG4gICAgICBpZiAoa2V5ID4gaW5kZXgpIHtcbiAgICAgICAgc2l6ZSA9IGtleSAtIGluZGV4O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmZyZWVMaXN0W2luZGV4XSA9IHNpemU7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWVtb3J5SGVscGVyO1xuIl19
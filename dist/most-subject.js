(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('most'), require('most/lib/scheduler/defaultScheduler'), require('@most/multicast'), require('@most/prelude')) :
  typeof define === 'function' && define.amd ? define(['exports', 'most', 'most/lib/scheduler/defaultScheduler', '@most/multicast', '@most/prelude'], factory) :
  (factory((global.mostSubject = global.mostSubject || {}),global.most,global.most.defaultScheduler,global.mostMulticast,global.mostPrelude));
}(this, function (exports,most,defaultScheduler,_most_multicast,_most_prelude) { 'use strict';

  defaultScheduler = 'default' in defaultScheduler ? defaultScheduler['default'] : defaultScheduler;

  var babelHelpers = {};

  babelHelpers.classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  babelHelpers.createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  babelHelpers.get = function get(object, property, receiver) {
    if (object === null) object = Function.prototype;
    var desc = Object.getOwnPropertyDescriptor(object, property);

    if (desc === undefined) {
      var parent = Object.getPrototypeOf(object);

      if (parent === null) {
        return undefined;
      } else {
        return get(parent, property, receiver);
      }
    } else if ("value" in desc) {
      return desc.value;
    } else {
      var getter = desc.get;

      if (getter === undefined) {
        return undefined;
      }

      return getter.call(receiver);
    }
  };

  babelHelpers.inherits = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };

  babelHelpers.possibleConstructorReturn = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  babelHelpers;

  /** The base Subject class, which is an extension of Stream
   * @typedef {Object} Subject
   */
  var Subject = function (_Stream) {
    babelHelpers.inherits(Subject, _Stream);

    function Subject() {
      babelHelpers.classCallCheck(this, Subject);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Subject).apply(this, arguments));
    }

    babelHelpers.createClass(Subject, [{
      key: 'next',

      /**
       * Push a new value to the stream
       *
       * @method next
       *
       * @param  {any}   value The value you want to push to the stream
       */
      value: function next(value) {
        this.source.next(value);
      }

      /**
       * Push an error and end the stream
       *
       * @method error
       *
       * @param  {Error} err The error you would like to push to the stream
       */

    }, {
      key: 'error',
      value: function error(err) {
        this.source.error(err);
      }

      /**
       * Ends the stream with an optional value
       *
       * @method complete
       *
       * @param  {any} value The value you would like to end the stream on
       */

    }, {
      key: 'complete',
      value: function complete(value) {
        this.source.complete(value);
      }
    }]);
    return Subject;
  }(most.Stream);

  function SubjectSource() {
    this.scheduler = defaultScheduler;
    this.sinks = [];
    this.active = true;
  }

  // Source methods
  SubjectSource.prototype.run = function (sink, scheduler) {
    var n = this.add(sink);
    if (n === 1) {
      this.scheduler = scheduler;
    }
    return new SubjectDisposable(this, sink);
  };

  SubjectSource.prototype._dispose = function dispose() {
    this.active = false;
  };

  // Subject methods
  SubjectSource.prototype.next = function next(value) {
    if (!this.active) {
      return;
    }
    this._next(this.scheduler.now(), value);
  };

  SubjectSource.prototype.error = function error(err) {
    if (!this.active) {
      return;
    }

    this.active = false;
    this._error(this.scheduler.now(), err);
  };

  SubjectSource.prototype.complete = function complete(value) {
    if (!this.active) {
      return;
    }

    this.active = false;
    this._complete(this.scheduler.now(), value, this.sink);
  };

  // Multicasting methods
  SubjectSource.prototype.add = _most_multicast.MulticastSource.prototype.add;
  SubjectSource.prototype.remove = _most_multicast.MulticastSource.prototype.remove;
  SubjectSource.prototype._next = _most_multicast.MulticastSource.prototype.event;
  SubjectSource.prototype._complete = _most_multicast.MulticastSource.prototype.end;
  SubjectSource.prototype._error = _most_multicast.MulticastSource.prototype.error;

  // SubjectDisposable
  function SubjectDisposable(source, sink) {
    this.source = source;
    this.sink = sink;
    this.disposed = false;
  }

  SubjectDisposable.prototype.dispose = function () {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    var remaining = this.source.remove(this.sink);
    return remaining === 0 && this.source._dispose();
  };

  // flow-ignore-next-line: I want to extend another class
  var HoldSubjectSource = function (_SubjectSource) {
    babelHelpers.inherits(HoldSubjectSource, _SubjectSource);

    function HoldSubjectSource(bufferSize) {
      babelHelpers.classCallCheck(this, HoldSubjectSource);

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(HoldSubjectSource).call(this));

      _this.bufferSize = bufferSize;
      _this.buffer = [];
      return _this;
    }

    babelHelpers.createClass(HoldSubjectSource, [{
      key: 'add',
      value: function add(sink) {
        var buffer = this.buffer;
        if (buffer.length > 0) {
          pushEvents(buffer, sink);
        }
        babelHelpers.get(Object.getPrototypeOf(HoldSubjectSource.prototype), 'add', this).call(this, sink);
      }
    }, {
      key: 'next',
      value: function next(value) {
        if (!this.active) {
          return;
        }
        var time = this.scheduler.now();
        this.buffer = dropAndAppend({ time: time, value: value }, this.buffer, this.bufferSize);
        this._next(time, value);
      }
    }]);
    return HoldSubjectSource;
  }(SubjectSource);

  function pushEvents(buffer, sink) {
    for (var i = 0; i < buffer.length; ++i) {
      var _buffer$i = buffer[i];
      var time = _buffer$i.time;
      var value = _buffer$i.value;

      sink.event(time, value);
    }
  }

  function dropAndAppend(event, buffer, bufferSize) {
    if (buffer.length >= bufferSize) {
      return _most_prelude.append(event, _most_prelude.drop(1, buffer));
    }
    return _most_prelude.append(event, buffer);
  }

  /**
   * Creates a new Subject
   *
   * @return {Subject} {@link Subject}
   *
   * @example
   * import {subject} from 'most-subject'
   *
   * const stream = subject()
   *
   * stream.map(fn).observe(x => console.log(x))
   * // 1
   * // 2
   *
   * stream.next(1)
   * stream.next(2)
   * setTimeout(() => stream.complete(), 10)
   */
  function subject() {
    return new Subject(new SubjectSource());
  }

  /**
   * Create a subject with a buffer to keep from missing events.
   *
   * @param  {number}    bufferSize =             1 The maximum size of the
   * buffer to create.
   *
   * @return {Subject} {@link Subject}
   *
   * @example
   * import {holdSubject} from 'most-subject'
   *
   * const stream = holdSubject(3)
   *
   * stream.next(1)
   * stream.next(2)
   * stream.next(3)
   *
   * stream.map(fn).observe(x => console.log(x))
   * // 1
   * // 2
   * // 3
   *
   * setTimeout(() => stream.complete(), 10)
   */
  function holdSubject() {
    var bufferSize = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

    if (bufferSize <= 0) {
      throw new Error('First and only argument to holdSubject `bufferSize` ' + 'must be an integer 1 or greater');
    }
    return new Subject(new HoldSubjectSource(bufferSize));
  }

  exports.subject = subject;
  exports.holdSubject = holdSubject;

}));
//# sourceMappingURL=most-subject.js.map
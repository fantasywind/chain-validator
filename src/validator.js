import { EventEmitter } from 'events';

function getType(value) {
  if (Array.isArray(value)) {
    return 'array';
  }

  if (value instanceof RegExp) {
    return 'regex';
  }

  if (value instanceof Date) {
    return 'date';
  }

  if (value === null) {
    return 'null';
  }

  return typeof value;
}

const RULE_TYPE = Symbol('RULE_TYPE');
const RULE_MAX_LENGTH = Symbol('RULE_MAX_LENGTH');
const RULE_MIN_LENGTH = Symbol('RULE_MIN_LENGTH');
const RULE_LENGTH = Symbol('RULE_LENGTH');
const RULE_REQUIRED = Symbol('RULE_REQUIRED');

export const Rules = {
  TYPE: RULE_TYPE,
  MAX_LENGTH: RULE_MAX_LENGTH,
  MIN_LENGTH: RULE_MIN_LENGTH,
  LENGTH: RULE_LENGTH,
  REQUIRED: RULE_REQUIRED,
};

export class CoreValidator {
  constructor() {
    this.validators = [];

    this.isRequired = this.setRequired.bind(this);
  }

  validate(key, value) {
    return this.validators.reduce((prevResult, validator) => validator(prevResult, {
      key,
      value,
    }), null);
  }

  setRequired() {
    this.validators = [
      (prevResult, item) => {
        if (typeof item.value === 'undefined') {
          const err = new Error(`${item.key} is required, but it undefined.`);
          err.key = item.key;
          err.value = item.value;
          err.type = RULE_REQUIRED;
          return err;
        }

        return prevResult;
      },
      ...this.validators,
    ];

    return this;
  }
}

export class BasicType extends CoreValidator {
  constructor(type) {
    super();

    this.validators.push((prevResult, item) => {
      if (prevResult instanceof Error || typeof item.value === 'undefined') {
        return prevResult;
      }

      if (getType(item.value) !== type) {
        const err = new Error(`Incorrect type on ${item.key}, should be ${type}`);
        err.key = item.key;
        err.value = item.value;
        err.type = RULE_TYPE;
        err.rule = type;
        return err;
      }

      return prevResult;
    });

    switch (type) {
      case 'number':
        this.maxLen = this.setNumericMaxLen.bind(this);
        this.minLen = this.setNumericMinLen.bind(this);
        this.len = this.setNumericLen.bind(this);
        break;

      case 'string':
      case 'array':
        this.maxLen = this.setMaxLen.bind(this);
        this.minLen = this.setMinLen.bind(this);
        this.len = this.setLen.bind(this);
        break;

      default:
        break;
    }
  }

  setNumericLen(length) {
    if (typeof length !== 'number' || length % 1 !== 0) {
      throw new Error('lengthgth should be integer.');
    }

    this.validators.push((prevResult, item) => {
      if (prevResult instanceof Error || typeof item.value === 'undefined') {
        return prevResult;
      }

      const err = new Error(`Length not matched: ${item.key}, should be ${length}.`);
      err.key = item.key;
      err.value = item.value;
      err.type = RULE_LENGTH;
      err.rule = length;

      if (item.value % 1 === 0) {
        // Integer
        if (`${item.value}`.length !== length) {
          return err;
        }
      } else {
        // Float
        if (`${Math.floor(item.value)}`.length !== length) {
          return err;
        }
      }

      return prevResult;
    });

    return this;
  }

  setLen(length) {
    if (typeof length !== 'number' || length % 1 !== 0) {
      throw new Error('lengthgth should be integer.');
    }

    this.validators.push((prevResult, item) => {
      if (prevResult instanceof Error || typeof item.value === 'undefined') {
        return prevResult;
      }

      if (!item.value.length || item.value.length !== length) {
        const err = new Error(`Length not matched: ${item.key}, should be ${length}.`);
        err.key = item.key;
        err.value = item.value;
        err.type = RULE_LENGTH;
        err.rule = length;
        return err;
      }

      return prevResult;
    });

    return this;
  }

  setNumericMinLen(minLen) {
    if (typeof minLen !== 'number' || minLen % 1 !== 0) {
      throw new Error('minLength should be integer.');
    }

    this.validators.push((prevResult, item) => {
      if (prevResult instanceof Error || typeof item.value === 'undefined') {
        return prevResult;
      }

      const err = new Error(`Length insufficient: ${item.key}, should be less than ${minLen}.`);
      err.key = item.key;
      err.value = item.value;
      err.type = RULE_MIN_LENGTH;
      err.rule = minLen;

      if (item.value % 1 === 0) {
        // Integer
        if (`${item.value}`.length < minLen) {
          return err;
        }
      } else {
        // Float
        if (`${Math.floor(item.value)}`.length < minLen) {
          return err;
        }
      }

      return prevResult;
    });

    return this;
  }

  setMinLen(minLen) {
    if (typeof minLen !== 'number' || minLen % 1 !== 0) {
      throw new Error('minLength should be integer.');
    }

    this.validators.push((prevResult, item) => {
      if (prevResult instanceof Error || typeof item.value === 'undefined') {
        return prevResult;
      }

      if (!item.value.length || item.value.length < minLen) {
        const err = new Error(`Length insufficient: ${item.key}, should be more than ${minLen}.`);
        err.key = item.key;
        err.value = item.value;
        err.type = RULE_MIN_LENGTH;
        err.rule = minLen;
        return err;
      }

      return prevResult;
    });

    return this;
  }

  setNumericMaxLen(maxLen) {
    if (typeof maxLen !== 'number' || maxLen % 1 !== 0) {
      throw new Error('maxLength should be integer.');
    }

    this.validators.push((prevResult, item) => {
      if (prevResult instanceof Error || typeof item.value === 'undefined') {
        return prevResult;
      }

      const err = new Error(`Length exceeded: ${item.key}, should be less than ${maxLen}.`);
      err.key = item.key;
      err.value = item.value;
      err.type = RULE_MAX_LENGTH;
      err.rule = maxLen;

      if (item.value % 1 === 0) {
        // Integer
        if (`${item.value}`.length > maxLen) {
          return err;
        }
      } else {
        // Float
        if (`${Math.floor(item.value)}`.length > maxLen) {
          return err;
        }
      }

      return prevResult;
    });

    return this;
  }

  setMaxLen(maxLen) {
    if (typeof maxLen !== 'number' || maxLen % 1 !== 0) {
      throw new Error('maxLength should be integer.');
    }

    this.validators.push((prevResult, item) => {
      if (prevResult instanceof Error || typeof item.value === 'undefined') {
        return prevResult;
      }

      if (!item.value.length || item.value.length > maxLen) {
        const err = new Error(`Length exceeded: ${item.key}, should be less than ${maxLen}.`);
        err.key = item.key;
        err.value = item.value;
        err.type = RULE_MAX_LENGTH;
        err.rule = maxLen;
        return err;
      }

      return prevResult;
    });

    return this;
  }
}

export class ChainValidator extends EventEmitter {
  constructor(formula = {}) {
    super();

    this.formulas = Object.keys(formula).map((key) => {
      const keyFormula = typeof formula[key] === 'function' ? formula[key]() : formula[key];

      return {
        validate: keyFormula.validate.bind(keyFormula, key),
        key,
      };
    });
  }

  validate(data = {}) {
    let valid = true;

    this.formulas.forEach((formula) => {
      const result = formula.validate(data[formula.key]);

      if (result instanceof Error) {
        this.emit('error', result);
        console.warn(result.message);
        valid = false;
      }
    });

    return valid;
  }
}

export const Types = {};

Object.defineProperty(Types, 'string', {
  get: () => new BasicType('string'),
});
Object.defineProperty(Types, 'number', {
  get: () => new BasicType('number'),
});
Object.defineProperty(Types, 'array', {
  get: () => new BasicType('array'),
});
Object.defineProperty(Types, 'function', {
  get: () => new BasicType('function'),
});
Object.defineProperty(Types, 'object', {
  get: () => new BasicType('object'),
});
Object.defineProperty(Types, 'symbol', {
  get: () => new BasicType('symbol'),
});
Object.defineProperty(Types, 'regex', {
  get: () => new BasicType('regex'),
});
Object.defineProperty(Types, 'date', {
  get: () => new BasicType('date'),
});
Object.defineProperty(Types, 'null', {
  get: () => new BasicType('null'),
});

ChainValidator.Types = Types;

export default ChainValidator;

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

const VALID = Symbol('VALID');

const RULE_TYPE = Symbol('RULE_TYPE');
const RULE_MAX_LENGTH = Symbol('RULE_MAX_LENGTH');
const RULE_MIN_LENGTH = Symbol('RULE_MIN_LENGTH');
const RULE_LENGTH = Symbol('RULE_LENGTH');
const RULE_REQUIRED = Symbol('RULE_REQUIRED');
const RULE_DECIMAL = Symbol('RULE_DECIMAL');

export const Rules = {
  TYPE: RULE_TYPE,
  MAX_LENGTH: RULE_MAX_LENGTH,
  MIN_LENGTH: RULE_MIN_LENGTH,
  LENGTH: RULE_LENGTH,
  REQUIRED: RULE_REQUIRED,
  DECIMAL: RULE_DECIMAL,
};

class CoreValidator {
  constructor() {
    this.validators = [];

    Object.defineProperty(this, 'isRequired', {
      get: () => this.setRequired(),
    });
  }

  validate(key, value) {
    return this.validators.reduce((prevResult, validator) => validator(prevResult), {
      key,
      value,
      state: VALID,
    });
  }

  setRequired() {
    this.validators = [
      (item) => {
        if (typeof item.value === 'undefined') {
          const err = new Error(`${item.key} is required, but it undefined.`);
          err.key = item.key;
          err.value = item.value;
          err.type = RULE_REQUIRED;
          return Object.assign({}, item, {
            state: err,
          });
        }

        return item;
      },
      ...this.validators,
    ];

    return this;
  }
}

class BasicType extends CoreValidator {
  constructor(type) {
    super();

    this.validators.push((item) => {
      if (item.state instanceof Error || typeof item.value === 'undefined') {
        return item;
      }

      if (getType(item.value) !== type) {
        const err = new Error(`Incorrect type on ${item.key}, should be ${type}`);
        err.key = item.key;
        err.value = item.value;
        err.type = RULE_TYPE;
        err.rule = type;
        return Object.assign({}, item, {
          state: err,
        });
      }

      return item;
    });

    switch (type) {
      case 'number':
        this.maxLen = this.setNumericMaxLen.bind(this);
        this.minLen = this.setNumericMinLen.bind(this);
        this.len = this.setNumericLen.bind(this);

        Object.defineProperty(this, 'greedy', {
          get: () => this.setNumericGreedy(),
        });
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

  setNumericGreedy() {
    this.validators = [
      (item) => {
        if (!isNaN(item.value)) {
          return Object.assign({}, item, {
            value: parseFloat(item.value),
          });
        }

        return item;
      },
      ...this.validators,
    ];

    return this;
  }

  setNumericLen(length) {
    if (typeof length !== 'number' || length % 1 !== 0) {
      throw new Error('lengthgth should be integer.');
    }

    this.validators.push((item) => {
      if (item.state instanceof Error || typeof item.value === 'undefined') {
        return item;
      }

      const err = new Error(`Length not matched: ${item.key}, should be ${length}.`);
      err.key = item.key;
      err.value = item.value;
      err.type = RULE_LENGTH;
      err.rule = length;

      if (item.value % 1 === 0) {
        // Integer
        if (`${item.value}`.length !== length) {
          return Object.assign({}, item, {
            state: err,
          });
        }
      } else {
        // Float
        if (`${Math.floor(item.value)}`.length !== length) {
          return Object.assign({}, item, {
            state: err,
          });
        }
      }

      return item;
    });

    return this;
  }

  setLen(length) {
    if (typeof length !== 'number' || length % 1 !== 0) {
      throw new Error('lengthgth should be integer.');
    }

    this.validators.push((item) => {
      if (item.state instanceof Error || typeof item.value === 'undefined') {
        return item;
      }

      if (!item.value.length || item.value.length !== length) {
        const err = new Error(`Length not matched: ${item.key}, should be ${length}.`);
        err.key = item.key;
        err.value = item.value;
        err.type = RULE_LENGTH;
        err.rule = length;
        return Object.assign({}, item, {
          state: err,
        });
      }

      return item;
    });

    return this;
  }

  setNumericMinLen(minLen) {
    if (typeof minLen !== 'number' || minLen % 1 !== 0) {
      throw new Error('minLength should be integer.');
    }

    this.validators.push((item) => {
      if (item.state instanceof Error || typeof item.value === 'undefined') {
        return item;
      }

      const err = new Error(`Length insufficient: ${item.key}, should be less than ${minLen}.`);
      err.key = item.key;
      err.value = item.value;
      err.type = RULE_MIN_LENGTH;
      err.rule = minLen;

      if (item.value % 1 === 0) {
        // Integer
        if (`${item.value}`.length < minLen) {
          return Object.assign({}, item, {
            state: err,
          });
        }
      } else {
        // Float
        if (`${Math.floor(item.value)}`.length < minLen) {
          return Object.assign({}, item, {
            state: err,
          });
        }
      }

      return item;
    });

    return this;
  }

  setMinLen(minLen) {
    if (typeof minLen !== 'number' || minLen % 1 !== 0) {
      throw new Error('minLength should be integer.');
    }

    this.validators.push((item) => {
      if (item.state instanceof Error || typeof item.value === 'undefined') {
        return item;
      }

      if (!item.value.length || item.value.length < minLen) {
        const err = new Error(`Length insufficient: ${item.key}, should be more than ${minLen}.`);
        err.key = item.key;
        err.value = item.value;
        err.type = RULE_MIN_LENGTH;
        err.rule = minLen;
        return Object.assign({}, item, {
          state: err,
        });
      }

      return item;
    });

    return this;
  }

  setNumericMaxLen(maxLen) {
    if (typeof maxLen !== 'number' || maxLen % 1 !== 0) {
      throw new Error('maxLength should be integer.');
    }

    this.validators.push((item) => {
      if (item.state instanceof Error || typeof item.value === 'undefined') {
        return item;
      }

      const err = new Error(`Length exceeded: ${item.key}, should be less than ${maxLen}.`);
      err.key = item.key;
      err.value = item.value;
      err.type = RULE_MAX_LENGTH;
      err.rule = maxLen;

      if (item.value % 1 === 0) {
        // Integer
        if (`${item.value}`.length > maxLen) {
          return Object.assign({}, item, {
            state: err,
          });
        }
      } else {
        // Float
        if (`${Math.floor(item.value)}`.length > maxLen) {
          return Object.assign({}, item, {
            state: err,
          });
        }
      }

      return item;
    });

    return this;
  }

  setMaxLen(maxLen) {
    if (typeof maxLen !== 'number' || maxLen % 1 !== 0) {
      throw new Error('maxLength should be integer.');
    }

    this.validators.push((item) => {
      if (item.state instanceof Error || typeof item.value === 'undefined') {
        return item;
      }

      if (!item.value.length || item.value.length > maxLen) {
        const err = new Error(`Length exceeded: ${item.key}, should be less than ${maxLen}.`);
        err.key = item.key;
        err.value = item.value;
        err.type = RULE_MAX_LENGTH;
        err.rule = maxLen;
        return Object.assign({}, item, {
          state: err,
        });
      }

      return item;
    });

    return this;
  }
}

class ExtendNumericType extends BasicType {
  constructor(type) {
    super('number');

    switch (type) {
      case 'float':
      case 'double':
        this.validators.push(this.validFloat.bind(this));

        this.decimal = this.setDecimal.bind(this);
        break;

      case 'integer':
      default:
        this.validators.push(this.validInteger.bind(this));
        break;
    }
  }

  setDecimal(decimal) {
    if (typeof decimal !== 'number' || decimal % 1 !== 0) {
      throw new Error('decimal should be integer.');
    }

    this.validators.push((item) => {
      if (item.state instanceof Error || typeof item.value === 'undefined') {
        return item;
      }

      const err = new Error(`Length exceeded: ${item.key}, should be less than ${decimal}.`);
      err.key = item.key;
      err.value = item.value;
      err.type = RULE_DECIMAL;
      err.rule = decimal;

      `${item.value}`.match(/\.(\d+)$/);

      if (RegExp.$1.length > decimal) {
        return Object.assign({}, item, {
          state: err,
        });
      }

      return item;
    });

    return this;
  }

  validFloat(item) {
    if (item.state instanceof Error || typeof item.value === 'undefined') {
      return item;
    }

    if (item.value % 1 === 0) {
      const err = new Error(`Incorrect type on ${item.key}, should be float`);
      err.key = item.key;
      err.value = item.value;
      err.type = RULE_TYPE;
      err.rule = 'float';
      return Object.assign({}, item, {
        state: err,
      });
    }

    return item;
  }

  validInteger(item) {
    if (item.state instanceof Error || typeof item.value === 'undefined') {
      return item;
    }

    if (item.value % 1 !== 0) {
      const err = new Error(`Incorrect type on ${item.key}, should be integer`);
      err.key = item.key;
      err.value = item.value;
      err.type = RULE_TYPE;
      err.rule = 'integer';
      return Object.assign({}, item, {
        state: err,
      });
    }

    return item;
  }
}

export class ChainValidator extends EventEmitter {
  constructor(formula = {}) {
    super();

    this.formulas = Object.keys(formula).map((key) => ({
      validate: formula[key].validate.bind(formula[key], key),
      key,
    }));
  }

  validate(data = {}) {
    let valid = true;

    this.formulas.forEach((formula) => {
      const result = formula.validate(data[formula.key]);

      if (result.state instanceof Error) {
        this.emit('error', result.state);
        console.warn(result.state.message);
        valid = false;
      }
    });

    return valid;
  }
}

export const Types = {};

// Basic Types
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

// Extend Numeric Type
Object.defineProperty(Types, 'integer', {
  get: () => new ExtendNumericType('integer'),
});
Object.defineProperty(Types, 'float', {
  get: () => new ExtendNumericType('float'),
});
Object.defineProperty(Types, 'double', {
  get: () => new ExtendNumericType('double'),
});

ChainValidator.Types = Types;

export default ChainValidator;

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
          return new Error(`${item.key} is required, but it undefined.`);
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
        return new Error(`Incorrect type on ${item.key}, should be ${type}`);
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

      if (item.value % 1 === 0) {
        // Integer
        if (`${item.value}`.length !== length) {
          return new Error(`Length not matched: ${item.key}, should be ${length}.`);
        }
      } else {
        // Float
        if (`${Math.floor(item.value)}`.length !== length) {
          return new Error(`Length not matched: ${item.key}, should be ${length}.`);
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
        return new Error(`Length not matched: ${item.key}, should be ${length}.`);
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

      if (item.value % 1 === 0) {
        // Integer
        if (`${item.value}`.length < minLen) {
          return new Error(`Length insufficient: ${item.key}, should be less than ${minLen}.`);
        }
      } else {
        // Float
        if (`${Math.floor(item.value)}`.length < minLen) {
          return new Error(`Length insufficient: ${item.key}, should be more than ${minLen}.`);
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
        return new Error(`Length insufficient: ${item.key}, should be more than ${minLen}.`);
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

      if (item.value % 1 === 0) {
        // Integer
        if (`${item.value}`.length > maxLen) {
          return new Error(`Length exceeded: ${item.key}, should be less than ${maxLen}.`);
        }
      } else {
        // Float
        if (`${Math.floor(item.value)}`.length > maxLen) {
          return new Error(`Length exceeded: ${item.key}, should be less than ${maxLen}.`);
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
        return new Error(`Length exceeded: ${item.key}, should be less than ${maxLen}.`);
      }

      return prevResult;
    });

    return this;
  }
}

export class ChainValidator {
  constructor(formula = {}) {
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

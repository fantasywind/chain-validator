# chain-validator
Chainable Object Types Validator

## Usage

```javascript
// ES6
import ChainValidator, {
  Types as T,
} from 'chain-validator';

const validator = new ChainValidator({
  name: T.string.maxLen(10).minLen(4).isRequired,
  age: T.number.len(2).isRequired,
  birthday: T.date,
  callback: T.function,
  info: T.object,
  liked: T.array,
  test: T.regex,
  brand: T.symbol,
});

const data = {
  name: 'Chia Yu Pai',
  age: 26,
  birthday: new Date('1990/02/08'),
  info: {
    bio: 'hello world',
  },
  liked: [
    'apple',
    'linux',
  ],
  test: /t/i,
  brand: Symbol('Apple Inc.'),
};

if (validator.validate(data)) {
  // Pass
} else {
  // Invalid
}
```

## To-Do

* shape check
* unit test case

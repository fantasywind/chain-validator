# chain-validator
Chainable Object Types Validator

## Usage

```javascript
// ES6
import ChainableValidator, {
  Types as T,
} from 'chainable-validator';

const validator = new ChainableValidator({
  name: T.string.maxLen(10).minLen(4).isRequired,
  age: T.integer.len(2).isRequired,
  birthday: T.date,
  callback: T.function,
  info: T.object,
  liked: T.array,
  test: T.regex,
  brand: T.symbol,
  latitude: T.float.decimal(5).greedy,
  longitude: T.double.decimal(5), // alias of float
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
  latitude: '22.19009',
  longitude: 122.457
};

validator.on('error', (err) => {
  // invalid rule triggered
});

if (validator.validate(data)) {
  // Pass
} else {
  // Invalid
}
```

## To-Do

* shape check
* unit test case

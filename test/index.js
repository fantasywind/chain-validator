import ChainableValidator, {
  Types as T,
} from '../src/validator.js';

const validator = new ChainableValidator({
  name: T.string.maxLen(10).minLen(4).isRequired,
  age: T.number.len(2).isRequired.greedy,
  birthday: T.date,
  callback: T.function,
  info: T.object,
  liked: T.array,
  test: T.regex,
  brand: T.symbol,
  optional: T.string.len(3),
});

const data = {
  name: 'Fooweee',
  age: '20',
  birthday: new Date('1990/02/08'),
  callback: () => {},
  info: {
    bio: 'foobar',
  },
  liked: [
    'apple',
    'banana'
  ],
  test: /t/i,
  brand: Symbol('Apple Inc.'),
};

validator.on('error', (err) => {
  console.log('- onError:', err.type, err.rule);
});

if (validator.validate(data)) {
  console.log('Pass');
} else {
  console.log('Invalid');
}

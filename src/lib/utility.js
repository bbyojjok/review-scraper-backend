/**
 * object deep compare
 * @param { Object }
 */
function deepCompare() {
  var i, l, leftChain, rightChain;

  function compare2Objects(x, y) {
    var p;

    if (
      isNaN(x) &&
      isNaN(y) &&
      typeof x === 'number' &&
      typeof y === 'number'
    ) {
      return true;
    }

    if (x === y) {
      return true;
    }

    if (
      (typeof x === 'function' && typeof y === 'function') ||
      (x instanceof Date && y instanceof Date) ||
      (x instanceof RegExp && y instanceof RegExp) ||
      (x instanceof String && y instanceof String) ||
      (x instanceof Number && y instanceof Number)
    ) {
      return x.toString() === y.toString();
    }

    // At last checking prototypes as good as we can
    if (!(x instanceof Object && y instanceof Object)) {
      return false;
    }

    if (
      Object.prototype.isPrototypeOf.call(x, y) ||
      Object.prototype.isPrototypeOf.call(y, x)
    ) {
      return false;
    }

    if (x.constructor !== y.constructor) {
      return false;
    }

    if (x.prototype !== y.prototype) {
      return false;
    }

    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
      return false;
    }

    for (p in y) {
      if (
        Object.prototype.hasOwnProperty.call(y, p) !==
        Object.prototype.hasOwnProperty.call(x, p)
      ) {
        return false;
      } else if (typeof y[p] !== typeof x[p]) {
        return false;
      }
    }

    for (p in x) {
      if (
        Object.prototype.hasOwnProperty.call(y, p) !==
        Object.prototype.hasOwnProperty.call(x, p)
      ) {
        return false;
      } else if (typeof y[p] !== typeof x[p]) {
        return false;
      }

      switch (typeof x[p]) {
        case 'object':
        case 'function':
          leftChain.push(x);
          rightChain.push(y);

          if (!compare2Objects(x[p], y[p])) {
            return false;
          }

          leftChain.pop();
          rightChain.pop();
          break;

        default:
          if (x[p] !== y[p]) {
            return false;
          }
          break;
      }
    }

    return true;
  }

  if (arguments.length < 1) {
    return true;
  }

  for (i = 1, l = arguments.length; i < l; i++) {
    leftChain = [];
    rightChain = [];

    if (!compare2Objects(arguments[0], arguments[i])) {
      return false;
    }
  }

  return true;
}

/**
 * object key add
 * @param { Object } obj
 * @param { Array } prop
 */
const objectKeyAdd = (obj, prop) => {
  return Object.keys(obj).reduce((newObj, key) => {
    if (prop.includes(key)) {
      newObj[key] = obj[key];
    }
    return newObj;
  }, {});
};

/**
 * get random
 * @param { Integer } min
 * @param { Integer } max
 * @param { Integer } num
 */
const getRandom = (min, max, num = 1) => {
  const randomResult = [];
  const randomList = [];
  for (let i = min; i <= max; i++) {
    randomList.push(i);
  }
  for (let i = 0; i < num; i++) {
    let randomNumber = Math.floor(Math.random() * randomList.length);
    randomResult.push(randomList[randomNumber]);
    randomList.splice(randomNumber, 1);
  }
  return randomResult.length === 1 ? randomResult[0] : randomResult;
};

/**
 * get cron rule
 */
const getCronRule = () => {
  /*
    #Cron-style Scheduling
      '* * * * * *'
      second (0 - 59, OPTIONAL)
      minute (0 - 59)
      hour (0 - 23)
      day of month (1 - 31)
      month (1 - 12)
      day of week (0 - 7) (0 or 7 is Sun)
  */
  //실제 적용할 크론 룰 (매일 00시 ~ 05시 사이 랜덤으로 분 초 적용)
  const rule = [
    getRandom(0, 59),
    getRandom(0, 59),
    getRandom(0, 4),
    '*',
    '*',
    '*',
  ].join(' ');
  console.log('[CRON] rule:', rule);
  return rule;
};

/**
 * 타이틀 특수문자 제거 -, (
 */
const trimTitle = (str) => {
  if (str.indexOf('-') !== -1) {
    return str.split('-')[0].trim();
  }
  if (str.indexOf('(') !== -1) {
    return str.split('(')[0].trim();
  }
  return str;
};

export { objectKeyAdd, deepCompare, getCronRule, getRandom, trimTitle };

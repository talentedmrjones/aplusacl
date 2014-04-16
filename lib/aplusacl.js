var _ = require('lodash');

var defaults = {
  roleAttribute: 'role',
  resourceAttribute:'resource',
  resources:[],
  roles:[],
  allows:[],
  assertions:{}
};

var AplusACL = module.exports = function (options) {
  _.merge(this, defaults, options);
};

AplusACL.prototype.isAllowed = function (user, resource, permission, options, callback) {
  var
    self = this,
    defaults = {
      assertionContext:this
    },
    role = user[self.roleAttribute],
    resourceName = (_.isString(resource)?resource:(_.isObject(resource)?resource[this.resourceAttribute]:'')),
    isAllowed = false,
    assertion = this.assertions[role+"_can_"+permission+"_"+resourceName]
  ;

  if (_.isFunction(options)) {
    callback = options;
    options = {};
  }

  if (!_.isObject(options)) {
    options = {};
  }

  options = _.merge(defaults, options);
  //console.log('checking', role+"_can_"+permission+"_"+resourceName);
  //console.log('options', options);

  if (this.resources.indexOf(resourceName) < 0 || this.roles.indexOf(role) < 0) {
    if (_.isFunction(callback)) {
      return callback(null, false);
    }
    return false;
  }

  this.allows.forEach(function (allow) {
    if (allow.role === role && allow.resource === resourceName && allow.permissions.indexOf(permission) > -1) {
      isAllowed = true;
    }
  });

  if (!isAllowed) {
    if (_.isFunction(callback)) {
      return callback(null, false);
    }
    return false;
  }

  if (isAllowed && _.isFunction(assertion)) {
    //console.log('asserting', role+"_can_"+permission+"_"+resourceName);
    return assertion.call(options.assertionContext, user, resource, options, callback);
  }

  if (_.isFunction(callback)) {
    return callback(null, isAllowed);
  }

  return isAllowed;

};

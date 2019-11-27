/**
 * Stamp.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    error: 'string',

    /**
     * @ORM({association: 'many to one', model: 'User'})
     * @type User.js
     */
    user: {
      model: 'user',
      required: true
    },

    /**
     * @ORM({association: 'many to one', model: 'Shift'})
     * @type Shift.js
     */
    shift: {
      model: 'shift'
    }
  }
};


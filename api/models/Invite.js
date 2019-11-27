/**
 * Invite.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    /**
     * @ORM({association: 'many to one', model: 'Node'})
     * @type Node.js
     */
    node: {
      model: 'node',
      required: true
    },

    /**
     * @ORM({association: 'many to one', model: 'User'})
     * @type User.js
     */
    requester: {
      model: 'user',
      required: true
    },

    /**
     * @ORM({association: 'many to one', model: 'User'})
     * @type User.js
     */
    requested: {
      model: 'user',
      required: true
    }

  }
};


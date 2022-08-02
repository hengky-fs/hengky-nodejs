class Cruds {
  constructor(Model) {
    this.Model = Model;
  }

  async create(params, attributes = {}) {
    return this.Model.create(params, attributes);
  }

  static createBulk(paramsArr) {
    const modelObj = [];
    paramsArr.forEach((element) => {
      modelObj.push(new this.Model(element));
    });
    return this.Model.insertMany(modelObj);
  }

  async bulkCreate(params = [], attributes = {}) {
    return this.Model.bulkCreate(params, attributes);
  }

  async findOne(params = {}) {
    return this.Model.findOne({ raw: true, where: params });
  }

  async findOneWithRelation(params = {}, include = {}, attributes) {
    return this.Model.findOne({
      nest: true, raw: true, ...params, include, attributes,
    });
  }

  async findOneWithManyRelations(params = {}, include = {}, attributes) {
    return this.Model.findOne({
      nest: true, where: params, include, attributes,
    });
  }

  async count(params) {
    return this.Model.count(params);
  }

  async findAll(params) {
    return this.Model.findAll({ raw: true, ...params });
  }

  async findAndCountAll(params, page, limit) {
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 5;

    return this.Model.findAndCountAll({
      ...params,
      page: parsedPage,
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      raw: true,
    });
  }

  async findAllWithRelationAndCountAll(params, page, limit, include = {}, attributes) {
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 5;

    return this.Model.findAndCountAll({
      ...params,
      page: parsedPage,
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      raw: true,
      nest: true,
      include,
      attributes,
    });
  }

  async findAllWithRelation(params = {}, include = {}, attributes) {
    return this.Model.findAll({
      nest: true, raw: true, ...params, include, attributes,
    });
  }

  async findById(id, include = {}, attributes = {}) {
    return this.Model.findByPk(id, {
      raw: true,
      include,
      attributes,
    });
  }

  async findByUserId(userId) {
    return this.Model.findOne({ raw: true, where: { userId } });
  }

  async deleteById(id) {
    return this.Model.deleteOne({ id });
  }

  async deleteByUserId(id, userId) {
    return this.Model.deleteOne({ raw: true, where: { id, userId } });
  }

  async updateById(id, params = {}, attributes = {}) {
    return this.Model.update(params, { where: { id }, attributes });
  }

  async updateByUserId(userId, params = {}) {
    return this.Model.update(params, { where: { userId } });
  }

  async updateByIdAndUserId(id, userId, params = {}) {
    return this.Model.update(params, { where: { id, userId } });
  }

  async updateOrCreate(userId, params = {}) {
    return this.Model.upsert(params, { where: { userId } });
  }

  async update(condition, params = {}, attributes = {}) {
    return this.Model.update(params, { where: condition, attributes });
  }

  async sum(field, condition = {}) {
    return this.Model.sum(field, { where: condition });
  }
}

module.exports = Cruds;

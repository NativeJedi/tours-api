class ApiFeatures {
  constructor(query, queryParams) {
    this.query = query;
    this.queryParams = queryParams;
  }

  filter() {
    const { page, sort, limit, fields, ...filterParams } = this.queryParams;

    const filterString = JSON.stringify(filterParams).replace(
      /\b(gte|gt|lt|lte)\b/g,
      (m) => `$${m}`,
    );

    const findParam = JSON.parse(filterString);

    this.query.find(findParam);

    return this;
  }

  sort() {
    const { sort = '-createdAt' } = this.queryParams;

    const sortString = sort.split(',').join(' ');

    this.query.sort(sortString);

    return this;
  }

  selectFields() {
    const { fields = '-__v' } = this.queryParams;

    const selectedFieldsString = fields.split(',').join(' ');

    this.query.select(selectedFieldsString);

    return this;
  }

  paginate() {
    const { page, limit } = this.queryParams;

    const pageParam = Number(page) || 1;
    const limitParam = Number(limit) || 100;
    const skipParam = (pageParam - 1) * limitParam;

    this.query.skip(skipParam).limit(limitParam);

    return this;
  }
}

module.exports = ApiFeatures;

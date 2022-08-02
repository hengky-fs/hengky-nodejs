const validateOrderNumberFormat = (req, res, next) => {

  const param = req.params;
  const flag = /^[0-9]{6}INV[0-9]{8}$/g.test(param.orderNumber);

  if(!flag){
    const error = {
      message : 'Invalid format for order number'
    };
    return res
      .status(400)
      .send({ code: 400, message: error.message });
  }

  return next();
};

module.exports = validateOrderNumberFormat;

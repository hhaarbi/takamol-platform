const { Transaction, Quotation, Ticket, User } = require('../models');
const { Op } = require('sequelize');

const CATEGORY_PREFIX = {
  licenses: 'LIC',
  survey:   'SUR',
  reports:  'REP',
  design:   'DES'
};

const DEPT_PREFIX = {
  management: 'MGT',
  licenses:   'LIC',
  survey:     'SUR',
  design:     'DES',
  reports:    'REP',
  sales:      'SLS',
  accounting: 'ACC'
};

/**
 * توليد كود المعاملة: مثال LIC-26-001
 */
const generateTransactionCode = async (category) => {
  const prefix = CATEGORY_PREFIX[category] || 'GEN';
  const year = new Date().getFullYear().toString().slice(-2);
  const yearPrefix = `${prefix}-${year}-`;

  const lastTransaction = await Transaction.findOne({
    where: { transaction_code: { [Op.like]: `${yearPrefix}%` } },
    order: [['created_at', 'DESC']]
  });

  let sequence = 1;
  if (lastTransaction) {
    const lastSeq = parseInt(lastTransaction.transaction_code.split('-')[2], 10);
    sequence = lastSeq + 1;
  }
  return `${yearPrefix}${String(sequence).padStart(3, '0')}`;
};

/**
 * توليد رقم عرض السعر: مثال QUO-26-001
 */
const generateQuotationNumber = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `QUO-${year}-`;

  const last = await Quotation.findOne({
    where: { quotation_number: { [Op.like]: `${prefix}%` } },
    order: [['created_at', 'DESC']]
  });

  let sequence = 1;
  if (last) {
    const lastSeq = parseInt(last.quotation_number.split('-')[2], 10);
    sequence = lastSeq + 1;
  }
  return `${prefix}${String(sequence).padStart(3, '0')}`;
};

/**
 * توليد رقم التذكرة: مثال TKT-26-001
 */
const generateTicketNumber = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `TKT-${year}-`;

  const last = await Ticket.findOne({
    where: { ticket_number: { [Op.like]: `${prefix}%` } },
    order: [['created_at', 'DESC']]
  });

  let sequence = 1;
  if (last) {
    const lastSeq = parseInt(last.ticket_number.split('-')[2], 10);
    sequence = lastSeq + 1;
  }
  return `${prefix}${String(sequence).padStart(3, '0')}`;
};

/**
 * توليد كود الموظف: مثال LIC-ENG-001
 */
const generateEmployeeCode = async (department) => {
  const prefix = DEPT_PREFIX[department] || 'EMP';
  const pattern = `${prefix}-`;

  const last = await User.findOne({
    where: { employee_code: { [Op.like]: `${pattern}%` } },
    order: [['created_at', 'DESC']]
  });

  let sequence = 1;
  if (last && last.employee_code) {
    const parts = last.employee_code.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
  }
  return `${pattern}${String(sequence).padStart(3, '0')}`;
};

module.exports = {
  generateTransactionCode,
  generateQuotationNumber,
  generateTicketNumber,
  generateEmployeeCode
};

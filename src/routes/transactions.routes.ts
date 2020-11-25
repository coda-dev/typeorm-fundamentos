import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import FindCategoryService from '../services/FindCategoryService';

import uploadConfig from '../config/upload';

const upload = multer(uploadConfig);

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {

  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionsRepository.find();

  const balance = await transactionsRepository.getBalance();

  return response.json({
    transactions,
    balance,
  });

});

transactionsRouter.post('/', async (request, response) => {

  const { title, value, type, category } = request.body;

  const findCategory = new FindCategoryService();
  const createTrasaction = new CreateTransactionService();

  const categoryFind = await findCategory.execute({ title: category });

  const transaction = await createTrasaction.execute({ title, value, type, category: categoryFind });

  return response.json(transaction);


});

transactionsRouter.delete('/:id', async (request, response) => {
  
  const {id} = request.params;

  const deleteTransacation = new DeleteTransactionService();

  console.log(id);
  await deleteTransacation.execute({id});

  return response.status(204).send();

});

transactionsRouter.post('/import', upload.single('file'), async (request, response) => {
  
  const importTransactions = new ImportTransactionsService();

  const transactions = await importTransactions.execute(request.file.path);
  
  return response.json(transactions);

});

export default transactionsRouter;

import {getCustomRepository, getRepository, In, Index} from 'typeorm';
import Transaction from '../models/Transaction';
import csvParse from 'csv-parse';
import fs from 'fs';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {

  public async execute(filePath: string): Promise<Transaction[]> {

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const transactions: TransactionCSV[] = [];
    const categorys: string[] = [];

    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      from_line: 2, // começa na linha 2, pq no arquivo conta inicio com sendo 1 e nao 0
    });

    const arqCsv = contactsReadStream.pipe(parsers); // pegando linha a linha

    arqCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !value || !type) {
        return;
      }

      categorys.push(category);

      transactions.push({title, value, type, category});

    });

    await new Promise(resolve => arqCsv.on('end', resolve));

    const categorysExistent = await categoriesRepository.find({ 
      where: {
        title: In(categorys),
      }
    });

    const titlesCategorys = categorysExistent.map((category: Category) => 
      category.title,
    );

    // somente as categorias qua não existe no banco
    const addCategorysTittles = categorys.filter(
      category => !titlesCategorys.includes(category)
    ).filter((value, index, self) => self.indexOf(value) === index);

    const newCategorys = categoriesRepository.create( addCategorysTittles.map(title => ({
      title,
    })));

    await categoriesRepository.save(newCategorys);

    const findCategorys = [...newCategorys, ...categorysExistent];

    const createTrasactions = transactionsRepository.create( transactions.map(transaction => ({
      title: transaction.title,
      type: transaction.type,
      value: transaction.value,
      category: findCategorys.find(category => category.title === transaction.category),
    })));
    
    await transactionsRepository.save(createTrasactions);

    // exclui o arquivo
    await fs.promises.unlink(filePath);

    return createTrasactions;

  }

}

export default ImportTransactionsService;

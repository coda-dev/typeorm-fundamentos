import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

// pasta onde vai ficar as imagens
const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp'); 

export default {

	directory: tmpFolder,

    //configurando local das imagens
	storage: multer.diskStorage({
		destination: tmpFolder,
		filename(request, file, callback) {
			const fileHash = crypto.randomBytes(10).toString('hex');
			const fileName = `${fileHash}-${file.originalname}`;

			return callback(null, fileName);
		}
	}),
}
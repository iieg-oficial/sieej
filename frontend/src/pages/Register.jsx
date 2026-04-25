import { useForm } from 'react-hook-form';
import useGlobal from '../context/useGlobal';
import useAuth from '../context/useAuth';
import Typography from '../components/Typography';
import CardPage from '../components/CardPage';
import Input from '../components/Input';
import Button from '../components/Button';
import Message from '../components/Message';

export default function Register() {
    const { regexEmail, patternMessageEmail } = useGlobal();
    const { onRegister, isAuthLoading, authError, closeMessageError } = useAuth();
    const methods = useForm();
    const { trigger, handleSubmit } = methods;
        
    const onSubmit = async (data) => {
        if (await trigger()) {
            await onRegister(data);
        }
    };

    return (
        <CardPage>
            <form 
                id="register" 
                onSubmit={handleSubmit(onSubmit)} 
                className='w-[260px] m-auto'
            >
                <Typography as="h3" titleName="Registro"/>
                <Input 
                    name="username"
                    placeholder="Nombre de usuario"
                    methods={methods}
                    required
                />
                <Input 
                    name="nombre"
                    placeholder="Nombre"
                    methods={methods}
                    required
                />
                <Input 
                    name="apellido"
                    placeholder="Apellido"
                    methods={methods}
                    required
                />
                <Input 
                    type="email"
                    name="email"
                    placeholder="Correo electrónico"
                    pattern={regexEmail}
                    patternMessage={patternMessageEmail}
                    methods={methods}
                    normalize="lowercase"
                    filled
                    required
                />
                <Input 
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    normalize="normal"
                    methods={methods}
                    required
                />
                {authError && (
                    <Message
                        type="error"
                        message={authError}
                        onClose={closeMessageError}
                    />
                )}
                <div className="mt-4">
                    <Button 
                        type="submit" 
                        label="Registrarse" 
                        variant="primary" 
                        loading={isAuthLoading} 
                        fullWidth
                    />
                </div>
                <div className="mt-4">
                    <Button 
                        type="reset" 
                        label="Limpiar" 
                        variant="secondary" 
                        disabled={isAuthLoading} 
                        fullWidth
                    />
                </div>
            </form>
        </CardPage>
    );
}
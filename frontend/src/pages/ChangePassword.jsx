import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import useGlobal from '../context/useGlobal';
import useAuth from '../context/useAuth';
import logoIIEG from '../assets/svg/logo_iieg_login.svg';
import logoSIEEJ from '../assets/svg/logo_sieej_login.svg';
import Typography from '../components/Typography';
import CardPage from '../components/CardPage';
import Input from '../components/Input';
import Button from '../components/Button';
import Message from '../components/Message';

const ChangePassword = () => {
    const { regexPass, hostBackend } = useGlobal();
    const { onFetch, user, onCheckAuth } = useAuth();
    const methods = useForm();
    const navigate = useNavigate();
    const { trigger, handleSubmit, watch } = methods;
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const newPassword = watch('new_password');

    const onSubmit = async (data) => {
        if (!(await trigger())) return;
        if (data.new_password !== data.confirm_password) {
            setError('Las contraseñas nuevas no coinciden.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await onFetch(`${hostBackend}/autenticacion/cambiar-contrasena`, {
                method: 'POST',
                body: {
                    current_password: data.current_password,
                    new_password: data.new_password,
                },
            });

            const text = await response.text();
            const result = text ? JSON.parse(text) : null;

            if (!response.ok) {
                throw new Error(result?.detail || 'No se pudo actualizar la contrasena');
            }

            await onCheckAuth();
            navigate('/');
        } catch (err) {
            setError(err.message || 'Error al cambiar la contrasena.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <CardPage>
            <div className="md:grid md:grid-cols-2 w-full h-full lg:gap-5">
                <div className="flex flex-col items-center justify-center">
                    <form
                        id="change-password"
                        onSubmit={handleSubmit(onSubmit)}
                        className="w-[260px]"
                    >
                        <Typography as="h2" titleName="Cambia tu contraseña" />
                        <Typography
                            as="span"
                            titleName={
                                user?.must_change_password
                                    ? 'Tu contraseña es temporal. Define una nueva para continuar.'
                                    : 'Define tu nueva contraseña.'
                            }
                        />
                        <Input
                            type="password"
                            name="current_password"
                            label="Contraseña actual"
                            methods={methods}
                            normalize="normal"
                            required
                        />
                        <Input
                            type="password"
                            name="new_password"
                            label="Nueva contraseña"
                            pattern={regexPass}
                            methods={methods}
                            normalize="normal"
                            minLength={8}
                            required
                        />
                        <Input
                            type="password"
                            name="confirm_password"
                            label="Confirma la nueva contraseña"
                            methods={methods}
                            normalize="normal"
                            validate={(value) => value === newPassword || 'Las contraseñas no coinciden'}
                            required
                        />
                        <div className="mt-6">
                            <Message type="error" message={error} />
                            <Button
                                type="submit"
                                label="Actualizar contraseña"
                                variant="primary"
                                loading={submitting}
                                fullWidth
                            />
                        </div>
                    </form>
                </div>
                <div className="hidden md:flex flex-col items-center justify-center">
                    <img src={logoSIEEJ} alt="SIEEJ" />
                    <img src={logoIIEG} alt="IIEG" />
                </div>
            </div>
        </CardPage>
    );
};

export default ChangePassword;

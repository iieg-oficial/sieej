import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import useGlobal from '@context/useGlobal';
import useAuth from '@context/useAuth';
import logoIIEG from '@assets/svg/logo_iieg_login.svg';
import logoSIEEJ from '@assets/svg/logo_sieej_login.svg';
import Typography from '@components/Typography';
import CardPage from '@components/CardPage';
import Input from '@components/Input';
import Button from '@components/Button';
import Message from '@components/Message';
import { computePasswordStrength, isStrongEnough } from '@helpers/passwordStrength';

const ShieldIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-[#5C2472]">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
    </svg>
);

const RULE_LABELS = {
    length: 'Mínimo 8 caracteres',
    case: 'Una mayúscula y una minúscula',
    number: 'Al menos un número',
    special: 'Al menos un caracter especial',
};

const StrengthBar = ({ score, label }) => {
    const colorByScore = ['bg-neutral-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-500', 'bg-emerald-500'];
    const fillColor = colorByScore[score];
    return (
        <div className="mt-2">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded transition-colors ${i <= score ? fillColor : 'bg-neutral-200'}`}
                    />
                ))}
            </div>
            {label && <p className="text-[11px] text-[#7C7C7C] mt-1 font-garetmedium">{label}</p>}
        </div>
    );
};

const RulesChecklist = ({ rules }) => (
    <ul className="mt-2 space-y-1">
        {Object.entries(RULE_LABELS).map(([key, text]) => (
            <li key={key} className="flex items-center gap-2 text-[11px] font-garetmedium">
                <span className={rules[key] ? 'text-emerald-600' : 'text-[#8E8E8E]'}>
                    {rules[key] ? '✓' : '○'}
                </span>
                <span className={rules[key] ? 'text-[#465055]' : 'text-[#8E8E8E]'}>{text}</span>
            </li>
        ))}
    </ul>
);

const WelcomeStep = ({ user, onContinue }) => {
    const isForced = !!user?.must_change_password;
    return (
        <CardPage>
            <div className="flex flex-col items-center justify-center text-center max-w-[380px] mx-auto px-4">
                <div className="w-16 h-16 rounded-full bg-[#F0E2F5] flex items-center justify-center mb-6">
                    <ShieldIcon />
                </div>
                <Typography
                    as="h2"
                    titleName={isForced
                        ? `¡Hola, ${user?.nombre || ''}!`
                        : 'Cambia tu contraseña'}
                />
                <div className="mt-2">
                    <Typography
                        as="span"
                        className="text-[#465055]"
                        titleName={isForced
                            ? 'Por seguridad, debes cambiar la contraseña temporal que recibiste antes de continuar a SIEEJ.'
                            : 'Define una nueva contraseña para tu cuenta.'}
                    />
                </div>
                <ul className="text-left mt-6 space-y-1.5 text-[12px] text-[#465055] font-garetmedium">
                    {Object.values(RULE_LABELS).map((text) => (
                        <li key={text} className="flex items-center gap-2">
                            <span className="text-[#5C2472]">•</span>
                            {text}
                        </li>
                    ))}
                </ul>
                <div className="mt-8 w-full">
                    <Button
                        label="Cambiar mi contraseña"
                        variant="primary"
                        onClick={onContinue}
                        fullWidth
                    />
                </div>
            </div>
        </CardPage>
    );
};

const FormStep = ({ user, onBack, onSuccess }) => {
    const { hostBackend } = useGlobal();
    const { onFetch } = useAuth();
    const methods = useForm();
    const navigate = useNavigate();
    const { trigger, handleSubmit, watch } = methods;
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const newPassword = watch('new_password') || '';
    const strength = computePasswordStrength(newPassword);
    const isForced = !!user?.must_change_password;

    const onSubmit = async (data) => {
        if (!(await trigger())) return;
        if (!isStrongEnough(data.new_password)) {
            setError('La contraseña no cumple con los requisitos mínimos.');
            return;
        }
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
                throw new Error(result?.detail || 'No se pudo actualizar la contraseña');
            }

            await onSuccess();
            navigate('/');
        } catch (err) {
            setError(err.message || 'Error al cambiar la contraseña.');
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
                        className="w-[280px]"
                    >
                        <button
                            type="button"
                            onClick={onBack}
                            className="text-[12px] text-[#7C7C7C] hover:text-[#5C2472] font-garetmedium mb-4 flex items-center gap-1 cursor-pointer"
                            aria-label="Regresar"
                        >
                            ← Regresar
                        </button>
                        <Typography as="h2" titleName="Define tu contraseña" />
                        <Typography
                            as="span"
                            className="text-[#465055]"
                            titleName={isForced
                                ? 'Tu contraseña actual es temporal. Defínela ahora para continuar.'
                                : 'Define una nueva contraseña.'}
                        />
                        <Input
                            type="password"
                            name="current_password"
                            label={isForced ? 'Contraseña temporal' : 'Contraseña actual'}
                            methods={methods}
                            normalize="normal"
                            required
                        />
                        <Input
                            type="password"
                            name="new_password"
                            label="Nueva contraseña"
                            methods={methods}
                            normalize="normal"
                            required
                        />
                        {newPassword && (
                            <>
                                <StrengthBar score={strength.score} label={strength.label} />
                                <RulesChecklist rules={strength.rules} />
                            </>
                        )}
                        <Input
                            type="password"
                            name="confirm_password"
                            label="Confirma tu nueva contraseña"
                            methods={methods}
                            normalize="normal"
                            required
                        />
                        <div className="mt-6">
                            <Message type="error" message={error} />
                            <Button
                                type="submit"
                                label="Actualizar contraseña"
                                variant="primary"
                                loading={submitting}
                                disabled={!isStrongEnough(newPassword)}
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

const ChangePassword = () => {
    const { user, onCheckAuth } = useAuth();
    const isForced = !!user?.must_change_password;
    const [step, setStep] = useState(isForced ? 'welcome' : 'form');

    if (step === 'welcome') {
        return <WelcomeStep user={user} onContinue={() => setStep('form')} />;
    }
    return (
        <FormStep
            user={user}
            onBack={() => setStep('welcome')}
            onSuccess={onCheckAuth}
        />
    );
};

export default ChangePassword;

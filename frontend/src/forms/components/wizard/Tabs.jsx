import React from 'react';
import icoX from '@icons/ico_delete_predeterminada.svg';
import Button from '@components/Button';

const Tabs = ({
    show, vertical, className, items = [],
    activeTab, visitedTabs, onTabClick, onTabRemove,
    isMobile = false,
}) => {
    if (!show) return null;

    return (
        <div className={`flex felx-wrap bg-white ${className ?? ''} ${vertical ? 'flex-col items-start' : 'w-full items-center'}`}>
            {items.map((item, index) => {
                const isActive = activeTab === index;
                const allowRemove = vertical && isActive && typeof onTabRemove === 'function';
                return (
                    <Button
                        key={item.id ?? item._id ?? index}
                        variant="label"
                        label={isMobile ? index + 1 : `${index + 1}.  ${item.label || item.nombre_bd || item.nombre || `Item ${index + 1}`}`}
                        sufIcon={allowRemove ? icoX : null}
                        sufIconButton={allowRemove}
                        onSufClick={allowRemove ? () => onTabRemove(item, index) : undefined}
                        isActive={isActive}
                        isVisited={visitedTabs?.has(index)}
                        onClick={() => onTabClick?.(index)}
                        className={`line-clamp-1 ${vertical ? 'mb-0' : 'mr-4'}`}
                    />
                );
            })}
        </div>
    );
};

export default Tabs;

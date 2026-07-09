import React from 'react';
import icoX from '@icons/ico_delete_predeterminada.svg';
import Button from '@components/Button';

const Tabs = ({
    show, vertical, className, items = [],
    activeTab, visitedTabs, onTabClick, onTabRemove,
    isMobile = false, numbered = true,
}) => {
    if (!show) return null;

    return (
        <div
            role="tablist"
            aria-orientation={vertical ? 'vertical' : 'horizontal'}
            className={`flex flex-wrap bg-white ${className ?? ''} ${vertical ? 'flex-col items-start' : 'w-full items-center'}`}
        >
            {items.map((item, index) => {
                const isActive = activeTab === index;
                const allowRemove = isActive && typeof onTabRemove === 'function';
                const tabId = item.id ?? item._id ?? `tab-${index}`;
                const itemLabel = item.label || item.nombre_bd || item.nombre || `Item ${index + 1}`;
                return (
                    <Button
                        key={tabId}
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        variant="label"
                        label={!numbered ? itemLabel : isMobile ? index + 1 : `${index + 1}.  ${itemLabel}`}
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

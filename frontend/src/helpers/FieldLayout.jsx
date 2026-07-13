const FieldGrid = ({ col = 4, align = 'center', children }) => {
    const gripCol = {
        4: 'md:grid-cols-4',
        3: 'md:grid-cols-3'
    }

    const alingItem = {
        start: 'md:items-start',
        center: 'md:items-center',
        end: 'md:items-end'
    }

    return (
        <div className={`flex flex-col ${alingItem[align]} md:grid ${gripCol[col]} md:gap-x-6 md:gap-y-1`}>
            {children}
        </div>
    )
};

export default FieldGrid;
import React from 'react';
import Spinner from './Spinner';
import DynamicDiv from '../helpers/DynamicDiv';

const Loading = () => {
    return (
        <DynamicDiv className="loading-container" center>
            <Spinner />
        </DynamicDiv>
    );
};

export default Loading;